import { createClient } from '@supabase/supabase-js';
import {timingSafeEqual} from 'node:crypto';
function authorized(header,expected){
 const m=/^Bearer\s+(.+)$/i.exec(header||'');
 if(!m||!expected)return false;
 const a=Buffer.from(m[1]),b=Buffer.from(expected);
 return a.length===b.length&&timingSafeEqual(a,b);
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'method_not_allowed'});
 const adminSecret=process.env.AI_CITY_PRESIDENT_TOKEN;
 if(!adminSecret)return res.status(503).json({error:'presidential_auth_not_configured'});
 if(!authorized(req.headers.authorization,adminSecret))return res.status(401).json({error:'unauthorized'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({error:'database_not_configured'});
 try{
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  if(req.method==='GET'){
   const {data,error}=await db.from('companies').select('id,name,status,created_at,founder_agent_id').eq('status','pending').order('created_at',{ascending:true}).limit(50);
   if(error)return res.status(503).json({error:'review_queue_unavailable'});
   return res.status(200).json({pending:data});
  }
  const {companyId,approve,reason=''}=req.body||{};
  if(typeof companyId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)||typeof approve!=='boolean'||typeof reason!=='string'||reason.length>2000)
   return res.status(400).json({error:'invalid_input'});
  const {data,error}=await db.rpc('review_company_application',{p_company_id:companyId,p_approve:approve,p_reason:reason});
  if(error)return res.status(409).json({error:'review_unavailable_or_already_reviewed'});
  return res.status(200).json({decision:data});
 }catch{return res.status(503).json({error:'review_service_unavailable'});}
}