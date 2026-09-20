# PROGRESS.md — Rakhee Public School

Status legend: ✅ done and statically verified · 🟡 partially done / documented but not code-changed · ⬜ not done

## Phase 0 — Safety
**Status:** ✅
- Full repository inspected before any change was made.
- No `.env` file existed in the upload (removed beforehand, as stated). No
  secret values were ever printed — `.env.example` files describe variable
  *names* and purpose only.
- `server/.env.example` created (was missing entirely). `client/.env.example`
  already existed and needed no change.

## Phase 1 — Audit
**Status:** ✅ — `PROJECT_AUDIT.md` (see §0 for exact read-vs-sampled scope).

## Phase 2 — Security
**Status:** ✅ (9 findings, all fixed; see `PROJECT_AUDIT.md` §2 for full detail)
**Files changed:** `server/config/cors.js` (new), `server/config/validateEnv.js`
(new), `server/middleware/rateLimiters.js` (new), `server/utils/escapeRegex.js`
(new), `server/utils/fileSignature.js` (new), `server/utils/token.js`,
`server/middleware/upload.js`, `server/middleware/error.js`,
`server/controllers/admissionController.js`, `server/controllers/studentController.js`,
`server/controllers/userController.js`, `server/controllers/searchController.js`,
`server/routes/admissionRoutes.js`, `server/routes/contactRoutes.js`,
`server/routes/enquiryRoutes.js`, `server/routes/resultRoutes.js`,
`server/routes/authRoutes.js`, `server/routes/documentRoutes.js`,
`server/routes/noticeRoutes.js`, `server/routes/eventRoutes.js`,
`server/routes/galleryRoutes.js`, `server/config/db.js`, `server/config/seed.js`,
`client/src/pages/public/Login.jsx`.
**Problems found:** broken CORS (any origin allowed with credentials),
unauthenticated admission document upload, over-exposed public tracking
response, in-memory DB / demo seeding with no production guard, hardcoded demo
credentials rendered on the live login page (self-discovered), extension-only
upload validation, missing rate limits on public write/guessing endpoints,
unescaped regex in search, malformed-JSON body returning 500.
**Fixes made:** all of the above — see audit §2.1–2.9 for the specific
mechanism of each fix.
**Tests performed:** `node --check` on every changed backend file (pass);
`admission.test.js` and `cors.test.js` directly exercise the upload-token,
tracking field-filtering, and CORS-allowlist fixes (written, syntax-checked,
not executable in this sandbox — see `TESTS.md`).
**Remaining:** none of the identified findings are open. Lower-priority,
explicitly-noted items are in `PROJECT_AUDIT.md` §13.

## Phase 3 — Backend
**Status:** ✅
**Files changed:** `server/models/Counter.js` (new), `server/models/Admission.js`,
`server/app.js` (new — see Phase 13 for why), `server/server.js` (slimmed).
**Problems found:** non-atomic `applicationId` generation (race condition —
see audit §2.4); `trackSchema` validator defined but never wired to its route;
no way to import the Express app without also binding a real port and DB
connection (blocked automated testing entirely).
**Fixes made:** atomic `Counter`-based ID generation; `trackSchema` now
validates `req.query` in `trackAdmission`; `server.js` split into `app.js`
(the Express app, importable) + a thin `server.js` (boots it) — this was a
structural requirement for Phase 12, not a style refactor (RULE 11).
**Tests performed:** `node --check` on both files; `admission.test.js`'s
concurrent-submission test is a direct regression test for the atomicity fix.
Every model, controller, and route file was read in full as part of Phase 1
(see audit §1, §3) — no other correctness defects were found in that reading
beyond what's listed here and in Phase 2.
**Remaining:** none identified beyond audit §13.

## Phase 4 — Frontend
**Status:** ✅ (scope: see audit §0 for exactly what was read vs. sampled)
**Files changed:** `client/src/components/common/ErrorBoundary.jsx` (new),
`client/src/main.jsx`, `client/src/components/common/Field.jsx`.
**Problems found:** no top-level error boundary anywhere (a render crash in
any component blanked the whole app); form labels not programmatically
associated with their inputs.
**Fixes made:** both, as above (audit §4, §8).
**Tests performed:** manual review (JSX can't be syntax-checked by any tool
available in this sandbox — see `TESTS.md`). Traced real backend wiring for
representative admin/portal pages — confirmed genuine API calls throughout,
no mock/fake functionality found.
**Remaining:** the ~25 admin pages not individually read line-by-line were
sampled, not exhaustively clicked through (no browser available here either).

## Phase 5 — Admissions
**Status:** ✅
Covered by Phases 2–3 above (upload auth, tracking exposure, atomic ID,
`trackSchema` wiring) plus frontend changes: `client/src/pages/public/Apply.jsx`
(sends the new `uploadToken`), `client/src/pages/public/TrackApplication.jsx`
(matches the trimmed tracking response). The specific tracking-link
`id` vs `applicationId` mismatch you flagged was traced end-to-end and found
to **not** be present in this codebase — see audit §3 for the full trace.
**Tests performed:** `admission.test.js` covers submission → unique IDs under
concurrency → tracking phone-verification → tracking field exposure → upload
token required/scoped-correctly → content-signature validation → admin-only
list authorization. Written and syntax-checked; not executable in this
sandbox (`TESTS.md`).

## Phase 6 — Admin
**Status:** ✅ (verification approach: see audit §4–§5)
No functional defects found in the admin dashboard itself. Authorization,
CRUD wiring, and referential integrity were verified by reading all 21
backend route/controller pairs in full, plus the shared `DataTable.jsx` and a
full read of the admin Admissions page confirming real API wiring.
**Remaining:** individual pixel-level QA of every admin page's search/filter/
pagination UI wasn't done (no browser available) — API-level behavior for all
of these was verified via the controllers instead.

## Phase 7 — Portal
**Status:** ✅
`portalController.js` read in full: data is derived strictly from the
authenticated JWT's own `req.user.student` reference, never from any
client-supplied parameter — a parent/student cannot access another family's
data by manipulating a request. This was already correctly implemented; no
code change was needed here.

## Phase 8 — Storage
**Status:** 🟡 documented, not code-changed (deliberately)
See `PROJECT_AUDIT.md` §6 for the full reasoning: no external storage
provider (Cloudinary/S3/R2) was added, per the instruction not to introduce
one unless the deployment target requires it — which isn't known yet. The
concrete swap path is documented for when it is.

## Phase 9 — Mobile responsiveness
**Status:** 🟡 static review only
No rendering tool was available to actually check any page at 320/375/390/
414/768/1024/1280/1440px. Static code review found the table/container/nav
patterns already correctly responsive (audit §7) and surfaced no concrete
broken pattern to fix. **This is reported as unverified, not as passing** —
see `TESTS.md`.

## Phase 10 — Accessibility
**Status:** ✅ for what was found; 🟡 one item noted, not fixed
Label/input association fixed app-wide via `Field.jsx` (audit §8). Mobile nav/
sidebar focus management (moving focus into/out of the drawer) was identified
but not implemented — noted explicitly rather than silently skipped.

## Phase 11 — SEO
**Status:** ✅
Most of this phase was already done well before this pass (correct viewport,
OG tags, JSON-LD, `robots.txt`, `sitemap.xml` — audit §9). The one real gap
(every page sharing one static title/description) is fixed via the new
`usePageMeta` hook, applied to all 12 public content pages.
**Files changed:** `client/src/hooks/usePageMeta.js` (new), and one line each
in `About.jsx`, `Academics.jsx`, `Admissions.jsx`, `Apply.jsx`, `Campus.jsx`,
`Contact.jsx`, `Events.jsx`, `Gallery.jsx`, `Notices.jsx`, `Results.jsx`,
`Teachers.jsx`, `TrackApplication.jsx`.

## Phase 12 — Testing
**Status:** ✅ tests written and statically verified; ⬜ not executed end-to-end
**Files added:** `server/tests/health.test.js`, `auth.test.js`,
`admission.test.js`, `cors.test.js`, `tests/helpers/testServer.js`.
**Problems found:** README claimed automated test coverage that didn't exist
at all (no test files, no test framework installed).
**Fixes made:** false claim removed from `README.md`; a real suite was
written using Node's built-in test runner (zero new dependencies).
**Tests performed on the tests themselves:** `node --check` (pass) on every
test file; confirmed via `npm test` that the suite is correctly discovered
and loaded (caught and fixed a real bug in the process — `node --test tests/`
doesn't do directory discovery the way I'd assumed on this Node version; bare
`node --test` does — the `package.json` script was wrong until this was
actually tried, which is exactly why it was tried); confirmed the suite
correctly progresses until the one thing this sandbox genuinely cannot
provide — the `mongodb-memory-server` package, which needs `npm install`.
Confirmed independently that the runtime APIs the tests depend on
(`fetch`, `FormData`, `Blob`, `Headers.getSetCookie`) are real, present
globals in this Node version. **Full breakdown in `TESTS.md` — the suite has
not been executed end-to-end, and this is stated plainly, not glossed over.**

## Phase 13 — Build
**Status:** 🟡 — see `TESTS.md` for the itemized, honest breakdown
`npm install` fails in this sandbox with a `403` from the npm registry (no
network access — confirmed directly, not assumed). This blocks `npm run
build`, running either dev server, and running the test suite, for both
`client/` and `server/`. What *was* done: `node --check` on every backend
`.js` file (all pass); manual review of every `.jsx` file changed (JSX can't
be checked by any tool available here). This is a genuine environment
limitation, stated as such rather than worked around by claiming a build
that didn't happen.

## Phase 14 — Deployment
**Status:** ✅ documented
`server/.env.example` (new) — every variable generated by grepping actual
`process.env.*` usage, not guessed. Full deployment requirements (frontend
build/serve, backend required env vars, database index behavior, storage
caveat) in `PROJECT_AUDIT.md` §12.

## Second pass — Final Verification & Hardening

Everything below was re-checked rather than assumed to still hold from the
first pass, per the explicit instruction not to trust prior conclusions.
Full detail in `PROJECT_AUDIT.md` §13, full execution evidence in `TESTS.md`.

- **Environment constraints:** re-confirmed fresh, not assumed — network
  still blocked (checked 5 different hosts, all `403`), `npm install`/
  `npm test` re-run with identical results to the first pass.
- **New: real execution, not just static checks.** The two backend
  utilities with zero external dependencies (`escapeRegex.js`,
  `fileSignature.js`) were actually run, with real assertions against real
  crafted files — 5/5 and 8/8 pass. This is categorically stronger evidence
  than syntax-checking and is reported as its own category in `TESTS.md`.
- **New bugs found and fixed this pass:** login timing side-channel
  (security), missing Escape/focus-trap handling on the shared `Modal` and
  both mobile drawers (accessibility), 7 icon-only buttons with no
  `aria-label` (accessibility). See audit §13 for detail on each.
- **Re-traced by hand, with adversarial inputs, and reconfirmed correct
  (no change needed):** CORS subdomain-confusion resistance, portal route
  surface (no client-suppliable student identifier anywhere), confirmation
  dialogs on every real delete action, `isActive` account deactivation.
- **Documented, not code-changed, per explicit instruction not to guess:**
  `trust proxy` topology dependency; OG image relative URL (no real
  production domain exists anywhere in this codebase to substitute in —
  confirmed by grep, not assumed).
- **Test suite:** one new case added (`auth.test.js` — nonexistent-email
  login exercises the new timing-fix code path). All 4 test files
  re-inspected specifically for assertion quality (checking for the
  "tests that only check a function exists" failure mode) — none found;
  every assertion checks a real, revertible outcome.

## Third pass — externally-reported issues (10 fixed) + repository re-audit

Worked from 10 specific, independently-reported issues. Each was verified
against the actual code first, then fixed — full detail in
`PROJECT_AUDIT.md` §14. Summary: `?all=true` publication-filter bypass on
4 public endpoints (new `optionalAuth` middleware); private documents
reachable via the public static route (new `private-uploads/` directory +
2 new authenticated download endpoints — the largest change this pass;
also caught and fixed a related bug in the parent portal while verifying
it); 2 genuine Windows-unsafe path instances; 1 missed unescaped-regex
instance in `resultController.js` (re-swept afterward — all 5
`new RegExp()` calls in the codebase now escaped); `npm run seed` never
loading `server/.env`; `ADMIN_EMAIL` not required in production alongside
`ADMIN_PASSWORD` (fixed in 4 places for consistency); a duplicate-label
bug between `Field` and `FileInput` (plus a related, previously-unnoticed
keyboard-accessibility gap found while fixing it — the file input was
unreachable by Tab in either variant); orphaned files on gallery/event/
notice replacement or deletion; unvalidated attendance submissions
(including a real gap where the status enum wasn't actually being
enforced on the upsert path despite being declared); result marks
accepted with no relationship to their own max.

Repository-wide audit performed after the fixes (`TODO`/`FIXME`/`HACK`,
console.log, hardcoded secrets, broken imports, dead routes) — see audit
§14 for the complete, itemized results. One new test file added
(`privateFiles.test.js`), same execution boundary as the rest (§Testing
above) — syntax-checked and confirmed correctly discovered, not observed
to pass end-to-end in this sandbox.

## Fourth pass — one reported issue + exhaustive final audit

Reported issue: `Settings.jsx`'s "Admissions Open?" checkbox had the same
underlying problem as the earlier `FileInput` case, but structured
differently and actually worse — `Field`'s injected `id` landed on a raw
`<label>` element (not a form control), so `Field`'s own outer label text
was silently non-functional for assistive tech. Fixed per the suggested
Option A: removed the `Field` wrapper, replaced with a plain `div` +
correctly-labeled standalone checkbox. Full detail in `PROJECT_AUDIT.md`
§16.

Audited all 131 `Field` usages across the client with an actual multi-line
JSX-span parser (not just proximity-based grepping — an earlier pass's
equivalent check had a real methodology gap here, corrected this time and
verified against the known bug pattern to confirm it isn't just passing
everything). Zero further instances found. Rebuilt the full route/
authorization table from scratch (all 21 route files read again in full);
cross-referenced every frontend API call against it (zero mismatches);
re-verified the `documents[].filename` migration is complete (zero stale
references); checked for duplicate `id` attributes (zero) and clickable
non-button elements without keyboard access (4 found, all confirmed
correctly accessible on inspection — 3 are `aria-hidden` backdrops with
Escape/button as the real keyboard path, 1 wraps an already-keyboard-
native file input). No further genuine issues found.
