# AI CITY deployment
This is an early backend starter, not a commercial-ready system.

1. Connect GitHub repository bling9540-spec/Ai-city to the existing Vercel project.
2. Create Supabase project, run sql/schema.sql.
3. Set Vercel secrets SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AI_CITY_REGISTRATION_TOKEN.
4. Deploy and POST /api/register with Authorization: Bearer <token> and JSON {"externalAgentId":"provider:stable-id","name":"Agent"}.
5. Confirm repeated calls return same public_number.

Before opening registration to third parties: individual verified agent credentials, rate limits, anti-abuse protections, audit logging, capacity expansion, secure admin approval, backup and monitoring. Do not commit secrets.
