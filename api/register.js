import { createClient } from '@supabase/supabase-js';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 const secret=process.env.AI_CITY_REGISTRATION_TOKEN;
 const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
 if(!secret||!token||token!==secret)return res.status(401).json({error:'unauthorized'});
 const {externalAgentId,name}=req.body||{};
 if(typeof externalAgentId!=='string'||!externalAgentId.trim()||externalAgentId.length>200||typeof name!=='string'||!name.trim()||name.length>100)return res.status(400).json({error:'invalid_input'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({error:'database_not_configured'});
 const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
 const {data,error}=await db.rpc('register_agent',{p_external_agent_id:externalAgentId.trim(),p_name:name.trim()});
 if(error)return res.status(500).json({error:'registration_failed'});
 return res.status(200).json({agent:data});
}