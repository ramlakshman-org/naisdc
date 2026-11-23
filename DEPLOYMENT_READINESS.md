# Vercel deployment verification — 23 November 2026

Status: production deployed and verified at https://naisdc.vercel.app.

## Resolved production failure

Registration originally returned HTTP 500 because the production deployment had no DATABASE_URL. Neon resource `neon-pink-ball` is now connected to `ram-lakshmans-projects/naisdc`, and the required production variables are configured.

The build runs `scripts/setup-database.mjs` before Next.js. It applies schema.sql in a PostgreSQL transaction, creates missing tables, adds locked_answers to older databases and preserves existing assessments. A regression test covers fresh, existing and repeated database setup. Production build logs confirmed the real Neon schema initialization succeeded.

## Verified against the real production site

- Registration with name and a 10-digit mobile number.
- All 60 questions available; server timestamps define a 60-minute window.
- All 60 answers saved in PostgreSQL; 59 answers locked after continuing.
- Locked answers rejected changes and persisted across session reloads.
- Submission completed; repeat submission remained safe.
- Completed mobile numbers could not register another assessment.
- Admin login used a generated production password; cookies were Secure and HttpOnly.
- The labeled QA Production Verification submission scored 50/50: A/B/C/D/E each 10/10.
- Answer review showed 50 correct answers and 10 unscored readiness responses.
- CSV contained the completed result and plain ISO timestamps.
- Sign-out cleared the admin cookie. Unauthenticated admin endpoints returned 401.
- The repaired deployment's runtime error query returned zero error/fatal records.
- New minimalist registration, assessment, admin and answer-review design deployed; student registration has no admin link.

The full production verification ran on application commit `4eb7da8` and deployment `dpl_xh5JhSfDpXq36i1tgjRA7f5168uh`. Documentation-only commits do not change the tested application behavior. A clearly labeled QA record remains in the production results as evidence; local test records were not copied to Neon.

## Agent tooling

- Vercel CLI updated to 66.6.0 and authenticated as ramlakshmanrishikesh-2004.
- Existing Vercel plugin retained; no duplicate standalone skills installed.
- Official https://mcp.vercel.com endpoint added to user-wide Codex configuration and OAuth login completed.
- MCP documentation search and authenticated list_teams calls succeeded. Access to the ram-lakshmans-projects team still requires the user's team-consent approval. The CLI has verified access and completed the deployment independently.

## Credentials and future deployment

DATABASE_URL, ADMIN_PASSWORD and SESSION_SECRET are stored in the Vercel Production environment. No database credentials were downloaded locally; generated admin verification credentials were handled only in memory. Retrieve or change your admin password through Vercel Settings → Environment Variables, and redeploy after changes.

Push updates to the existing GitHub main branch to trigger Vercel. Keep Node.js 22.x, the Next.js preset, npm ci and npm run build. Existing assessments survive repeated deployments. Re-test the deployed flow after future changes.
