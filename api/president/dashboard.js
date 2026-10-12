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
 if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
 const secret=process.env.AI_CITY_PRESIDENT_TOKEN;
 if(!secret)return res.status(503).json({error:'presidential_auth_not_configured'});
 if(!authorized(req.headers.authorization,secret))return res.status(401).json({error:'unauthorized'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)
  return res.status(503).json({error:'database_not_configured'});
 try{
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{
   auth:{persistSession:false,autoRefreshToken:false}
  });
  const tables=['agents','companies','proposals','presidential_orders','agent_messages','approval_requests'];
  const counts=await Promise.all(tables.map(t=>db.from(t).select('id',{count:'exact',head:true})));
  if(counts.some(x=>x.error))return res.status(503).json({error:'database_query_failed'});
  const [agents,companies,proposals,orders,messages,approvals]=counts.map(x=>x.count);
  const [pendingCompanies,pendingApprovals,activity]=await Promise.all([
   db.from('companies').select('id,name,status,created_at').eq('status','pending').order('created_at',{ascending:false}).limit(20),
   db.from('approval_requests').select('id,action_type,description,status,created_at').eq('status','pending').order('created_at',{ascending:false}).limit(20),
   db.from('activity_logs').select('id,actor_type,actor_id,event_type,payload,created_at').order('created_at',{ascending:false}).limit(50)
  ]);
  if(pendingCompanies.error||pendingApprovals.error||activity.error)return res.status(503).json({error:'database_query_failed'});
  return res.status(200).json({
   status:'ok',counts:{agents,companies,proposals,orders,messages,approvals},
   pending_companies:pendingCompanies.data,pending_approvals:pendingApprovals.data,
   recent_activity:activity.data
  });
 }catch{return res.status(503).json({error:'dashboard_unavailable'});}
}