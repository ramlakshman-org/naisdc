# Intern Skill Assessment

The existing Next.js assessment, using the original question bank and Neon PostgreSQL setup.

- Student registration: name and a 10-digit mobile number, with an independent-work declaration. Student pages do not show an admin link; coordinators open `/admin` directly.
- 60 MCQs in 60 minutes, with Previous, Next and Submit. Next locks a selected answer; Previous allows review only. Skipped questions remain answerable.
- Answers save to PostgreSQL. Refreshing on the same browser resumes the assessment without resetting its timer.
- The existing first 50 questions are scored: five categories of 10, for a total out of 50. The existing 10 learning-readiness questions are saved but unscored.
- Submission leads to a simple thank-you page; students do not see scores.
- `/admin` has a single password login, student results, five category scores, completion status and CSV download. Select **View answers** on a completed assessment to see each student's selected answer, the correct answer, and correct/incorrect/unanswered status. The 10 readiness questions show responses as unscored. Answer keys are provided only by the authenticated admin endpoint.
- The existing unique-mobile database constraint prevents repeat completed submissions. In-progress attempts also remain unique and can be resumed on the original browser.

## Local setup

Use Node.js 22 LTS and the existing Neon PostgreSQL database.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and set the three real values below.
3. Run `schema.sql` in the database SQL editor. It is safe to rerun: the included `ALTER TABLE` adds `locked_answers` to existing databases without changing saved answers or scores. Apply this before deploying this update.
4. Run `npm run dev` and open http://localhost:3000.

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Existing Neon PostgreSQL connection string, including SSL |
| `ADMIN_PASSWORD` | Unique admin password of at least 12 characters |
| `SESSION_SECRET` | Random secret of at least 32 characters |

Generate a session secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

## Verification

```text
npm run check
npm test
npm run build
```

`npm test` exercises the actual API handlers and SQL against a temporary in-memory PostgreSQL-compatible PGlite database. The test substitutes the Neon transport and Next.js cookie context. It does not contact or modify the live database. It covers validation, saving all 60 answers, scores out of 50 and five categories out of 10, partial/empty submissions, expiry, duplicate blocking, admin access and CSV escaping.

## Vercel deployment

See `DEPLOYMENT_READINESS.md` for the final verification scope and remaining production setup.

1. Import this existing project into Vercel with the **Next.js** framework preset and the repository root as the root directory.
2. Use Node.js **22.x**. Leave the output directory at its Next.js default. The build command is `npm run build` and the install command is `npm ci`.
3. Set `DATABASE_URL`, `ADMIN_PASSWORD` and `SESSION_SECRET` in the intended Vercel environment. Reuse the existing PostgreSQL database. Do not add `NEXT_PUBLIC_` prefixes to these secrets.
   The Vercel build applies `schema.sql` in a transaction before building Next.js. This creates missing assessment tables and adds `locked_answers` without deleting saved assessments. Production builds also check the admin password and session-secret lengths. Database credentials remain in Vercel; they do not need to be downloaded locally.
4. Deploy, then check student registration and `/admin` with disposable test data before sharing the URL.

The local `Intern_Skill_Assessment_Vercel_Source.zip` export contains the source and lockfile without dependencies, build output or real environment values. Generated ZIP exports are excluded from Git; import this repository directly into Vercel.

## Timing and persistence

The server enforces the one-hour deadline on every answer write. The browser submits automatically when its timer ends. If a student closes the page or loses connectivity, saved answers cannot be changed after the deadline; the attempt is finalized and scored when its session, admin results or CSV export is next requested. No scheduled job is required.

Scoring locks the attempt and reads its persisted answers in one SQL statement, so an answer save racing with submission cannot leave scores inconsistent with saved answers. Submitting again is safe and does not alter the result.

The browser retains an opaque assessment token in local storage; the database stores only its hash. Keep the same browser to resume. Knowing a mobile number does not grant access to its answers. Admin access uses an eight-hour signed HttpOnly cookie, Secure on deployment. No OTP or student account is required.

## Verification limits

A production build and isolated database tests can run without live credentials. Verifying the actual Neon connection and deployed Vercel environment requires the configured environment variables and a deployment. No production connection or deployment was made as part of this preparation.

## Local test preview without Neon credentials

After `npm ci` and `npm run build`, run `node scripts/local-preview.cjs`.
Open http://127.0.0.1:3000 and http://127.0.0.1:3000/admin.
The local-only admin password is `local-admin-123`.

This optional launcher uses the development-only PGlite engine and persists disposable test data in `.local-assessment/` (ignored by Git). It intercepts only its own fake Neon connection inside the local process; application routes and production PostgreSQL configuration are unchanged. The launcher always uses local test data, even if real credentials exist. Use `npm start` or the normal Vercel deployment for the real configured database. Local preview test submissions are separate from production submissions.
