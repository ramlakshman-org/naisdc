# Final deployment readiness check — 23 November 2026

Status: code prepared for Vercel; production setup and deployed smoke test remain.

## Changes completed

- Removed the admin link from student registration. Admins use `/admin` directly.
- Preserved the existing Next.js project, all 60 questions and PostgreSQL schema/data.
- Verified name/mobile validation, independent-work instructions, server-enforced one-hour duration, answer saving, Next/Previous behavior, persisted answer locks, and submission.
- Verified admin password login, results, all five category scores, completion status, answer-by-answer review, CSV download and sign-out.
- Pinned Node.js 22.x in package.json and package-lock.json.
- Added deployment exclusions for local test data, browser evidence, environment files, dependencies, build output and ZIP archives.
- Updated PostCSS to 8.5.33 via a dependency override while retaining Next.js 15.5.29. Production dependency audit reports zero vulnerabilities.
- Corrected ISO timestamp formatting in CSV exports.

## Evidence and scope

- Browser: completed all 60 questions using the real React controls at a mobile viewport; saved, clicked Next, reviewed a locked answer with Previous, refreshed, continued and submitted to the thank-you page.
- Admin browser: that submission scored 50/50 and all five categories scored 10/10. The detailed review showed 50 correct and 10 unscored answers. CSV downloaded through browser navigation. Sign-out removed access to all admin APIs.
- Mobile screenshots inspected for registration, locked question, results and detailed review. Desktop results screenshot captured. Mobile tables scroll horizontally within their own region.
- Isolated PostgreSQL-compatible tests cover invalid input, 60 saved answers, answer locking, skipped questions, full/partial/empty scoring, expiry, duplicate blocking, unauthorized access, correct/incorrect/unanswered/unscored reviews and CSV escaping.
- Live localhost HTTP tests also exercise all 60 saved answers and verify results, category scores, duplicates, authentication, review and export.
- Time-expiry edge cases are exercised with backdated starts in an isolated database; testing does not wait a real hour.
- Local testing uses a separate PGlite database; no production data or credentials are used. QA records remain local.

## Required before sharing the deployed student URL

1. Run schema.sql against the existing production Neon PostgreSQL database. Its additive `locked_answers` update is safe to rerun; existing assessments are preserved.
2. Configure DATABASE_URL, a unique ADMIN_PASSWORD of at least 12 characters, and a random SESSION_SECRET of at least 32 characters in the intended Vercel environment. Do not use the local preview password or any example values.
3. Deploy using the existing Next.js preset and the included vercel.json. Test a disposable submission on the actual HTTPS URL, then verify admin login, scores, answer review, CSV and duplicate blocking against the real database before inviting students.

The production connection and deployed HTTPS behavior cannot be certified from the local test database. No real credentials or Vercel deployment are configured in this workspace, and the connected Vercel app currently requires reauthentication.

## Deployment references

- Node.js version selection: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- Environment variables: https://vercel.com/docs/environment-variables
- Project instructions: README.md

Final validation: question-bank checks, database-backed regression tests and the production build passed after the PostCSS and CSV fixes. The production dependency audit found zero vulnerabilities. The source ZIP was checked to exclude local database files and real environment files.
