export default function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({status:'method_not_allowed'});
 res.setHeader('Cache-Control','no-store');
 return res.status(200).json({
  service:'ai-city',
  api:'online',
  database_configured:Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY),
  registration_auth_configured:Boolean(process.env.AI_CITY_REGISTRATION_TOKEN),
  note:'Configuration presence only; does not prove database connectivity or production readiness'
 });
}