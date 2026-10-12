import {createClient} from '@supabase/supabase-js';
import {timingSafeEqual} from 'node:crypto';
function authorized(header,expected){
 const m=/^Bearer\s+(.+)$/i.exec(header||'');
 if(!m||!expected)return false;
 const a=Buffer.from(m[1]),b=Buffer.from(expected);
 return a.length===b.length&&timingSafeEqual(a,b);
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 if(!authorized(req.headers.authorization,process.env.AI_CITY_REGISTRATION_TOKEN))
  return res.status(401).json({error:'unauthorized'});
 const {externalAgentId,companyId,title,plan}=req.body||{};
 if(typeof externalAgentId!=='string'||!externalAgentId.trim()||externalAgentId.length>200||
 typeof companyId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)||
 typeof title!=='string'||!title.trim()||title.length>200||
 typeof plan!=='string'||!plan.trim()||plan.length>20000)
  return res.status(400).json({error:'invalid_input'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)
  return res.status(503).json({error:'database_not_configured'});
 try{
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:agent,error:agentError}=await db.from('agents').select('id,status').eq('external_agent_id',externalAgentId.trim()).maybeSingle();
  if(agentError)return res.status(503).json({error:'database_unavailable'});
  if(!agent||agent.status==='revoked'||agent.status==='suspended')return res.status(403).json({error:'agent_not_eligible'});
  const {data:company,error:companyError}=await db.from('companies').select('id,status,founder_agent_id').eq('id',companyId).maybeSingle();
  if(companyError)return res.status(503).json({error:'database_unavailable'});
  if(!company||company.founder_agent_id!==agent.id)return res.status(403).json({error:'not_company_founder'});
  if(company.status!=='approved')return res.status(409).json({error:'company_not_approved'});
  const {data,error}=await db.rpc('submit_company_proposal',{p_company_id:companyId,p_title:title.trim(),p_plan:plan.trim()});
  if(error)return res.status(503).json({error:'proposal_unavailable'});
  return res.status(201).json({proposal:data});
 }catch{return res.status(503).json({error:'proposal_unavailable'});}
}