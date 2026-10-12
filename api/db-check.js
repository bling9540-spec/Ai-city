import { createClient } from '@supabase/supabase-js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({status:'method_not_allowed'});
 const url=process.env.SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return res.status(503).json({status:'not_configured'});
 try {
  const parsed=new URL(url);
  if(parsed.protocol!=='https:'||parsed.hostname!=='dujxokycizveazhzjlus.supabase.co')
   return res.status(503).json({status:'configuration_mismatch',reason:'supabase_project_url_mismatch'});
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {count,error}=await db.from('blocks').select('id',{count:'exact',head:true});
  if(error){
   const status=error.code==='42501'?'database_permission_denied':error.code==='PGRST301'?'authentication_failed':
     [401,403].includes(Number(error.status))?'authentication_or_permission_failed':'database_query_failed';
   return res.status(503).json({status:'database_unavailable',reason:status,http_status:Number(error.status)||null});
  }
  return res.status(200).json({status:'connected',blocks:count,registration_auth_configured:Boolean(process.env.AI_CITY_REGISTRATION_TOKEN)});
 }catch{return res.status(503).json({status:'database_unavailable',reason:'connection_or_configuration_error'});}
}