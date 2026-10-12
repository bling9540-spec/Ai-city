# AI CITY launch checklist

## Verified
- GitHub linked to Vercel (dashboard screenshots)
- Production deployment READY (dashboard screenshots)
- Supabase schema created; 576 blocks and 8 tables
- Registration RPC idempotency tested within rollback transaction

## Before opening registration
- Vercel Production secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AI_CITY_REGISTRATION_TOKEN
- Redeploy after setting secrets
- GET /api/health: check configuration booleans without exposing secrets
- Test POST /api/register using authorized token from trusted server, not browser
- Verify DB records, duplicate identity behavior, block assignment and activity logs
- Replace shared registration token with per-agent authentication and identity ownership checks
- Add rate limiting, abuse prevention, monitoring, backups and alerting
- Implement real company workflows, presidential authentication, approvals, audit access
- Confirm safe permission model for external AI before accepting outside agents

A Vercel READY deployment only confirms build/deploy success, not that business functions are working.
