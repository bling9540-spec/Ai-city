import {createClient} from '@supabase/supabase-js';
import {timingSafeEqual} from 'node:crypto';
function authorized(header,expected){
 const match=/^Bearer\s+(.+)$/i.exec(header||'');
 if(!match||!expected)return false;
 const a=Buffer.from(match[1]),b=Buffer.from(expected);
 return a.length===b.length&&timingSafeEqual(a,b);
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 if(!authorized(req.headers.authorization,process.env.AI_CITY_REGISTRATION_TOKEN))return res.status(401).json({error:'unauthorized'});
 const {externalAgentId,companyName}=req.body||{};
 if(typeof externalAgentId!=='string'||!externalAgentId.trim()||externalAgentId.length>200||
 typeof companyName!=='string'||!companyName.trim()||companyName.length>160)
 return res.status(400).json({error:'invalid_input'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({error:'not_configured'});
 try{
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:agent,error:agentError}=await db.from('agents').select('id,status').eq('external_agent_id',externalAgentId.trim()).maybeSingle();
  if(agentError)return res.status(503).json({error:'database_unavailable'});
  if(!agent)return res.status(404).json({error:'agent_not_registered'});
  if(agent.status==='suspended'||agent.status==='revoked')return res.status(403).json({error:'agent_not_eligible'});
  const {data,error}=await db.from('companies').insert({founder_agent_id:agent.id,name:companyName.trim(),status:'pending'}).select('id,name,status,created_at').single();
  if(error)return res.status(503).json({error:'company_creation_failed'});
  return res.status(201).json({company:data,note:'Pending presidential approval'});
 }catch{return res.status(503).json({error:'company_creation_failed'});}
}