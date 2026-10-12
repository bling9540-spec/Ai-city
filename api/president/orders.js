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
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'method_not_allowed'});
 if(!process.env.AI_CITY_PRESIDENT_TOKEN)return res.status(503).json({error:'president_auth_not_configured'});
 if(!authorized(req.headers.authorization,process.env.AI_CITY_PRESIDENT_TOKEN))return res.status(401).json({error:'unauthorized'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({error:'database_not_configured'});
 try{
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  if(req.method==='GET'){
   const {data,error}=await db.from('presidential_orders').select('id,title,instructions,status,created_at').order('created_at',{ascending:false}).limit(50);
   if(error)return res.status(503).json({error:'orders_unavailable'});
   return res.status(200).json({orders:data});
  }
  const {title,instructions}=req.body||{};
  if(typeof title!=='string'||!title.trim()||title.length>200||typeof instructions!=='string'||!instructions.trim()||instructions.length>10000)
   return res.status(400).json({error:'invalid_input'});
  const {data,error}=await db.from('presidential_orders').insert({title:title.trim(),instructions:instructions.trim(),status:'draft'}).select('id,title,status,created_at').single();
  if(error)return res.status(503).json({error:'order_creation_failed'});
  return res.status(201).json({order:data,note:'Draft only; no external execution'});
 }catch{return res.status(503).json({error:'orders_unavailable'});}
}