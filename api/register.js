import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';
const validToken=(supplied,expected)=>{
 if(typeof supplied!=='string'||typeof expected!=='string'||!expected)return false;
 const a=Buffer.from(supplied),b=Buffer.from(expected);
 return a.length===b.length&&timingSafeEqual(a,b);
};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 const expected=process.env.AI_CITY_REGISTRATION_TOKEN;
 const match=/^Bearer\s+(.+)$/i.exec(req.headers.authorization||'');
 if(!validToken(match?.[1],expected))return res.status(401).json({error:'unauthorized'});
 const {externalAgentId,name}=req.body||{};
 if(typeof externalAgentId!=='string'||!externalAgentId.trim()||externalAgentId.length>200||
 typeof name!=='string'||!name.trim()||name.length>100)
  return res.status(400).json({error:'invalid_input'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)
  return res.status(503).json({error:'database_not_configured'});
 try{
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{
   auth:{persistSession:false,autoRefreshToken:false}
  });
  const {data,error}=await db.rpc('register_agent',{
   p_external_agent_id:externalAgentId.trim(),p_name:name.trim()
  });
  if(error)return res.status(503).json({error:'registration_unavailable'});
  return res.status(200).json({agent:data});
 }catch{return res.status(503).json({error:'registration_unavailable'});}
}