import { createClient } from '@supabase/supabase-js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({status:'method_not_allowed'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({status:'not_configured'});
 try {
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {count,error}=await db.from('blocks').select('id',{count:'exact',head:true});
  if(error)return res.status(503).json({status:'database_unavailable',reason:'database_query_failed'});
  return res.status(200).json({status:'connected',blocks:count,registration_auth_configured:Boolean(process.env.AI_CITY_REGISTRATION_TOKEN)});
 }catch{return res.status(503).json({status:'database_unavailable'});}
}