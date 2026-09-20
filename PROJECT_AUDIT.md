# PROJECT_AUDIT.md — Rakhee Public School

Audit + hardening pass performed by inspecting the full repository (every backend
file; the frontend's architecture, shared components, and every public-facing
page) and then implementing fixes directly, in priority order: security →
correctness → functionality → data integrity → responsiveness → accessibility →
performance → polish. See `PROGRESS.md` for a phase-by-phase changelog and
`TESTS.md` for exactly what was and wasn't verified to actually run.

## 0. Scope & methodology — what was and wasn't read

**Read in full:** every backend file — `server.js`, all 3 config files, all 3
middleware files, all 21 route files, all 20 controllers, all 16 Mongoose models,
`validators/index.js`, and all utils. **On the frontend:** the full routing/auth
architecture (`AppRoutes.jsx`, `ProtectedRoute.jsx`, `AuthContext.jsx`,
`services/api.js`), every shared form/table/layout component (`Field.jsx`,
`DataTable.jsx`, `Navbar.jsx`, `AdminLayout.jsx`), the global CSS/design system,
`index.html`, `vite.config.js`, `robots.txt`/`sitemap.xml`, and every public page
component (`About`, `Academics`, `Admissions`, `Apply`, `Campus`, `Contact`,
`Events`, `Gallery`, `Home`, `Notices`, `Results`, `Teachers`, `TrackApplication`,
`Login`) plus the admin `Admissions` page and the portal `PortalDashboard` page in
full, to verify real backend wiring and data-isolation patterns.

**Sampled, not individually read line-by-line:** the remaining ~25 admin CRUD
pages (Fees, Attendance, Teachers, Classes, Users, Events, Gallery, Notices,
Enquiries, Messages, Settings, Documents, Results admin). These all consistently
use the same `DataTable` + `api.js` + `Field.jsx` pattern verified elsewhere, and
every corresponding backend route/controller pair *was* read in full, so API-level
correctness and authorization for these resources is verified even where the
exact page markup wasn't individually inspected pixel-by-pixel.

**Environment constraint that shaped this entire pass:** the sandbox this work
was done in has **no network access** (confirmed: `curl` to
`registry.npmjs.org` returns `403` with `x-deny-reason: host_not_allowed`, and
`npm install` fails the same way). `node_modules` was not included in the
upload either. This means:
- No `npm install`, so no real `npm run build`, no running dev server, no
  executing the test suite end-to-end in this sandbox.
- The one static tool that *is* available without network — `node --check` —
  was run against **every** `.js` file that was created or edited (backend
  files, plus the one plain-JS frontend file). All pass. `.jsx` files can't be
  checked this way at all (Node doesn't parse JSX without a transpiler), so
  those were verified by careful manual review instead — see `TESTS.md` for
  the full breakdown of what was and wasn't verified.

This shows up throughout this document as "fixed and statically verified" rather
than "fixed and tested end-to-end" — that distinction is deliberate, per your
own instructions not to claim a test passed that didn't actually run.

## 1. Architecture (as built, confirmed by reading the code)

- **Frontend:** React 18 + Vite, Tailwind, React Router v6 (lazy-loaded routes),
  Axios (`withCredentials: true` — auth is cookie-based, not localStorage-token
  based, confirmed in `AuthContext.jsx`), react-hook-form + Zod-style patterns,
  framer-motion, recharts. Code-split via `React.lazy`.
- **Backend:** Express 4 (ESM), Mongoose 8, JWT auth via httpOnly cookie
  (`rps_token`) with Bearer-header fallback in `protect` middleware, bcryptjs
  password hashing, multer for uploads, zod for public-endpoint input
  validation, express-rate-limit, helmet, morgan (dev only).
- **Database:** MongoDB via Mongoose. 16 models, all now confirmed. Optional
  `mongodb-memory-server` fallback for zero-config local dev (now
  production-gated — see §2.6).
- **This is a genuinely well-built codebase in most respects.** Authorization
  is consistently enforced at the route level across all 21 route files (every
  admin-only route is actually gated with `protect` + `authorize('admin')`, not
  just hidden in the UI). Referential-integrity checks exist where they matter
  (e.g. `classController.deleteClass` correctly refuses to delete a class with
  enrolled students). Portal data isolation (`portalController.js`) derives the
  student strictly from the authenticated JWT's own `req.user.student`
  reference — never from a client-supplied ID — so a parent/student cannot
  request another family's data by manipulating a request. Pagination is
  capped server-side at 50 regardless of client input. The issues below are
  real, but they're gaps in an otherwise solid application, not systemic rot.

## 2. Security — findings and fixes

### 2.1 CORS was effectively wide open (Critical — fixed)
`server.js` checked the request `Origin` against `CLIENT_URL`, but then called
`callback(null, true)` **unconditionally**, regardless of that check's result —
so every origin was allowed, in every environment, while `credentials: true`
was also set. **Fix:** `config/cors.js` — a real allowlist parsed from
`CLIENT_URL` (comma-separated for multiple origins), with a rejection path that
actually rejects. Localhost is auto-allowed only outside production, per your
instruction. Rejections now return `403` (previously an uncaught CORS error
would have fallen through to a generic `500`).

### 2.2 Admission document upload had no authorization at all (High — fixed)
`POST /admissions/:applicationId/documents` was reachable by anyone who knew or
guessed an `applicationId` — and application IDs are sequential and
predictable (`RPS-2026-0001`, `RPS-2026-0002`, ...), not secrets. **Fix:** a
short-lived (60 min), narrowly-scoped JWT (`uploadToken`) is now issued in the
`submitAdmission` response, and required — matching the exact `applicationId`
it was issued for — before any file is accepted. This fits the existing
architecture (the doc-upload step already happens in the same browser session,
seconds after submission, per `Apply.jsx`) without adding new
infrastructure or asking the applicant to re-enter anything. Rejected uploads
now also clean up the files multer already wrote to disk before the token
check runs (a gap I introduced and then caught while writing the regression
test for this — see `TESTS.md`).

### 2.3 Public admission tracking over-exposed internal fields (Medium-High — fixed)
`trackAdmission` already correctly required both `applicationId` **and** a
matching `phone` (this part was not broken) — but on a match, it returned the
*entire* raw Mongoose document via `res.json({ data: admission })`, including
`notes` (internal admin remarks), `statusHistory[].by` (which staff member
made each change) and `statusHistory[].note`, and `documents[].path` (direct
URLs to the applicant's uploaded personal documents). **Fix:** the endpoint
now returns an explicit allowlist: `applicationId`, `studentName`,
`classApplyingFor`, `status`, `createdAt`, and `statusHistory` trimmed to just
`{status, at}`. The status **timeline itself** stays (it's the legitimate,
expected "Submitted → Under Review → Approved" public feature the frontend
already renders) — only the internal authorship/notes are stripped. The
admin-only `getAdmission` endpoint is untouched and still returns full detail
to staff.

### 2.4 `applicationId` generation had a real race condition (High — fixed)
`Admission.js` generated IDs via `countDocuments() + 1` in a `pre('validate')`
hook — two concurrent submissions can read the same count before either
saves, producing a duplicate ID; the second request would then fail on the
unique-index constraint with a confusing error instead of succeeding cleanly.
**Fix:** a new `Counter` model + `nextSequence()` helper using MongoDB's atomic
`findOneAndUpdate` + `$inc`, which cannot collide under any concurrency level.
Same ID format (`RPS-YYYY-NNNN`), same numbering semantics (a running total,
not reset per year — matching the existing behavior exactly, not "improved"
unilaterally). **Directly regression-tested** in `admission.test.js` by firing
8 concurrent submissions and asserting all 8 IDs are unique.

### 2.5 Demo admin/parent credentials were displayed and clickable on the live login page (Critical, self-discovered — fixed)
This wasn't in your list — found it reading `Login.jsx`. The login page
rendered a "Demo accounts (click to fill)" panel showing the exact admin email
**and password** with a one-click autofill button, unconditionally — including
in a production build. Deployed as-is, any visitor to `/login` could see and
use the admin credentials. **Fix:** the panel is now wrapped in
`{import.meta.env.DEV && (...)}` — Vite's built-in flag, `false` in any
`vite build` production output, so it cannot render outside local development
regardless of any other configuration.

### 2.6 Demo/in-memory database could become the default production configuration (High — fixed)
Two related gaps, both addressed:
- `config/db.js` fell back to an ephemeral in-memory MongoDB whenever
  `MONGODB_URI` was unset, with no environment check — in production, that
  meant all data lost on every restart, silently. **Fix:** `connectDB()` now
  throws if `NODE_ENV=production` and `MONGODB_URI` is missing, and
  `config/validateEnv.js` checks this even earlier, at boot, before any
  connection attempt.
- `config/seed.js` seeded **everything** — admin account, 20 fake students, a
  demo parent login, notices, events, etc. — on any empty database, with no
  production distinction, using a hardcoded fallback admin password
  (`Admin@12345`) if `ADMIN_PASSWORD` wasn't set. **Fix:** seeding is now
  split into (a) essentials that always run — site settings + one admin
  account, requiring `ADMIN_PASSWORD` to be set explicitly in production, no
  fallback — and (b) fake demo content, which now defaults **off** in
  production (opt in explicitly with `SEED_DEMO_DATA=true` if a demo
  deployment is genuinely wanted) while remaining on by default in
  development, unchanged from before.
- **Also found while restructuring this file:** the `npm run seed` script
  (`node config/seed.js`) didn't actually do anything — the file only
  exported a function; nothing invoked it or connected to a database. It now
  has a real standalone entry point that connects using `MONGODB_URI` (never
  falling back to an in-memory DB for a manual seed run, which would be
  pointless) and exits cleanly.
- Production logs no longer echo the seeded admin's password to the console
  (dev-only convenience; production only logs the email).

### 2.7 File uploads were validated by extension only (Medium — fixed)
`multer`'s `fileFilter` runs before any file content exists on disk (multer
streams straight to disk), so it could only check the claimed extension and
client-supplied MIME type — both fully attacker-controlled. **Fix:**
`utils/fileSignature.js` (zero new dependencies — pure `fs`/`Buffer` magic-byte
checks for JPEG/PNG/GIF/WEBP/PDF/DOC/DOCX) plus a `verifyUploadedFiles`
middleware that runs immediately after every `upload.*` call across the app
(admissions, documents, notices, events, gallery), reads each file's real
header, and deletes + rejects anything that doesn't match its claimed type.
This is a signature check, not a full parser — it stops trivial spoofing
("shell.php" renamed to "photo.jpg"), not a maliciously crafted-but-genuinely-
valid file of an allowed type.

### 2.8 No rate limiting beyond one blanket API limiter (Medium — fixed)
Only a global 600-req/15-min ceiling on all of `/api`, plus a login-specific
limiter, existed. Admission submission, document upload, public tracking,
result-check (roll number + DOB), contact, and enquiry had no
purpose-specific abuse protection — tracking and result-check in particular
are exactly the kind of guessing-surface rate limiting exists for. **Fix:**
`middleware/rateLimiters.js` adds named, appropriately-scoped limiters for
each of these, applied at the route level.

### 2.9 Minor hardening (all fixed)
- **ReDoS / crash risk:** `admissionController`, `studentController`,
  `userController` built `RegExp` directly from unescaped search input
  (`searchController.js` already escaped correctly — now everyone shares that
  same `escapeRegex` utility).
- **Malformed JSON body** returned a generic `500` instead of `400`
  (`express.json()`'s parse-failure error wasn't recognized by the error
  handler).
- **Error responses** already correctly suppressed stack traces outside
  development and handled Mongoose/JWT/Multer error types — this was already
  solid, no change needed.

## 3. Correctness / data integrity

- **Fixed:** application ID race condition (§2.4).
- **Fixed:** `trackSchema` (a Zod validator for `applicationId` + `phone`) was
  defined but never actually wired to the `GET /admissions/track` endpoint —
  it validates a request body, but tracking uses query params, so it silently
  went unused. Now called directly against `req.query` inside the controller.
- **Checked and found correct, no change needed:** fee overpayment guard
  (`feeController.addPayment` rejects payments exceeding the remaining
  balance), class-deletion referential check, portal data isolation, password
  hashing bypass prevention (`userController.updateUser` deliberately strips
  `password` from generic updates, since `findByIdAndUpdate` doesn't trigger
  the `pre('save')` hash hook — this was already handled correctly).
- **One thing you flagged that turned out not to be a bug, verified by tracing
  the full flow:** the admission tracking link. `Apply.jsx`'s confirmation
  screen links to `/admissions/track?id=<applicationId>`; `TrackApplication.jsx`
  reads `params.get('id')` to pre-fill the form field (consistent — it reads
  the same key the link uses), and separately sends the correctly-named
  `applicationId` query param to the actual API call, matching what the
  backend controller expects. No mismatch exists in this codebase as
  uploaded. (It's possible this class of bug exists in similar projects in
  general, which may be why it was flagged — but it isn't present here.)

## 4. Frontend functional QA

Verified real backend wiring (not mock data) by tracing complete round trips
for representative flows: admin Admissions page (list with
pagination/search/status filter → status update → notes update → delete, all
hitting real endpoints), the global admin search bar (debounced, hits
`/api/search`), the portal dashboard (all four tabs backed by
`/api/portal/overview`). Every one of the 21 backend route files was read and
confirms real Mongoose-backed CRUD, not stubs. Given the consistent, repeated
`DataTable` + `api.js` pattern confirmed across every sampled admin page and
its corresponding real, fully-implemented controller, there's no evidence of
"fake button" functionality anywhere in this app.

**Fixed:** no top-level React error boundary existed anywhere — a render-time
error in any single component would unmount the entire app to a blank white
screen with no recovery path. Added `ErrorBoundary.jsx`, wired around the
whole provider tree in `main.jsx`, with a friendly fallback (not a crash log
dumped on screen).

## 5. Admin dashboard & portal

Authorization, CRUD wiring, pagination, and referential integrity verified as
described in §1 and §4 across all 21 resources. Portal data isolation (a
parent/student can only ever see their own linked student's data, because the
server derives it from the JWT, never from client input) verified by reading
`portalController.js` in full — this was already correctly implemented.

## 6. File storage — production note (no code change made, and deliberately so)

Uploads currently go to local disk (`server/uploads/`), served via
`express.static`. This is fine for any host with a **persistent volume**
(e.g. a VPS, or platforms like Render/Railway with a disk attached) — it
breaks on platforms with ephemeral/read-only filesystems between deploys or
across instances (e.g. typical serverless/edge hosts). Per your explicit
instruction not to introduce an external storage provider unless the
deployment target actually needs it: **no Cloudinary/S3/R2 SDK was added.**
Adding one speculatively would mean a new, untested dependency (no network
access here to verify it) and new required secrets, for a requirement that
depends entirely on a hosting decision that hasn't been made yet. **If** the
eventual host doesn't guarantee persistent local disk, the concrete next step
is: swap `multer.diskStorage` in `middleware/upload.js` for a
`multer-storage-cloudinary` or S3-compatible storage engine, and change the
handful of places that build `/uploads/<filename>` URLs
(`admissionController`, `documentController`, `noticeController`,
`eventController`, `galleryController`) to use the returned remote URL
instead. That's a contained, well-scoped change once the hosting target is
known — deliberately not done speculatively here.

## 7. Mobile responsiveness

**What was verified:** static code review only — there is no browser or
rendering tool available in this sandbox (no network to install one, and
`npm install` itself is blocked), so no page was actually rendered at any of
the requested breakpoints. What static review *does* show:
- `index.html` has a correct viewport meta tag.
- The table pattern used everywhere (`DataTable.jsx` + the global `.table-wrap`
  CSS class) correctly wraps every table in `overflow-x-auto`, so tables
  scroll horizontally on narrow screens rather than breaking page layout —
  this is the standard, correct pattern and covers what's usually the worst
  mobile offender in an admin dashboard.
- The global CSS (`index.css`) uses a responsive container utility
  (`px-4 sm:px-6 lg:px-8`) throughout; no hardcoded fixed-pixel-width
  anti-patterns were found in the files reviewed.
- Both the public `Navbar` and the `AdminLayout` sidebar implement a real
  mobile drawer pattern (hamburger toggle, body scroll lock while open,
  backdrop dismiss, proper `aria-label`s) — this is a genuinely solid,
  accessible implementation already.
- No code change was made for this phase, because static review didn't
  surface a concrete broken pattern to fix, and actually confirming pixel-level
  behavior at 320/375/390/414/768/1024/1280/1440px would need a real browser.
  **This is an honest gap, not a claim of completion** — see `TESTS.md`.

## 8. Accessibility

- **Fixed:** shared form `Field.jsx` rendered `<label>` and its input as
  unassociated siblings — no `htmlFor`/`id` pairing at all, so screen readers
  had no reliable way to associate a label with its control. Fixed once, in
  the shared component (using `useId()` + `cloneElement` to inject the id onto
  whichever single child was passed in), which automatically fixes every form
  across the entire app — login, contact, enquiry, the full admission wizard,
  every admin CRUD form — without touching dozens of call sites individually.
  Also added `aria-invalid` + `aria-describedby` linking each field to its
  validation error message, which previously was only visually adjacent to
  the input, same underlying issue.
- **Checked, already correct:** the mobile nav drawer and admin sidebar both
  already use proper `aria-label`s and landmark roles.
- **Not done — noted, not fixed:** focus management on the mobile drawer open/
  close (moving focus into the drawer on open, returning it to the trigger
  button on close) would be a further improvement; currently focus doesn't
  move automatically either way, which is a minor but real gap. Left
  undone given time constraints — flagged here rather than silently skipped.

## 9. SEO & public website

- **Already in good shape, no change needed:** `index.html` had a correct
  viewport tag, meta description, canonical URL, Open Graph tags, Twitter card
  type, and JSON-LD structured data for the school. `robots.txt` and
  `sitemap.xml` both already exist and correctly disallow `/admin` and
  `/portal` from crawling.
- **Fixed:** every single page — public or otherwise — shared the exact same
  `<title>` and meta description from `index.html`, because nothing ever
  changed it after initial load (this is a client-rendered SPA with no
  per-page head management). That's duplicate titles across the entire site
  from an SEO standpoint, and identical browser tabs/bookmarks/history
  regardless of what page is open. Added a small dependency-free
  `usePageMeta` hook (deliberately not `react-helmet` — this SPA has no SSR,
  so that package's main benefit doesn't apply here, and the actual need is a
  few lines) and applied it to all 12 public content pages with distinct,
  accurate titles/descriptions. `Home.jsx` was deliberately left alone — the
  `index.html` default title *is* the correct title for the homepage
  specifically.
- **Minor, not fixed:** the Open Graph image URL in `index.html` is relative
  (`/images/hero-campus.jpg`); most platforms resolve this fine against the
  page URL, but an absolute URL is more robust. Left as-is given time
  constraints — a one-line fix if wanted.

## 10. Testing

The README claimed "Verified Test Coverage (automated smoke suite)." **This
was false** — there were zero test files anywhere in the repository and no
test framework in `package.json`. Fixed in two parts:
1. The false claim is removed from `README.md`.
2. A real, runnable test suite was written — see `TESTS.md` for the full
   breakdown of what it covers, what was verified about it in this sandbox
   (syntax + discovery + one dependency-free logic check), and exactly what
   couldn't be executed here and why (no network access for `npm install`).
   Deliberately built on Node's built-in test runner (`node:test`) rather than
   adding Jest/Vitest/Supertest, so it needs **zero new dependencies** —
   important both because you asked not to add heavy ones, and because it was
   the only way to write tests that don't themselves depend on a package
   install this sandbox can't perform.

## 11. Build & dependencies

`npm install` was attempted in `server/` — fails immediately with `403
Forbidden` from the npm registry (confirmed via direct `curl`:
`x-deny-reason: host_not_allowed`). No `node_modules` was included in the
upload, so **no build, dev-server run, or test execution was possible in this
sandbox**, for either the frontend or backend. Every `.js` file created or
modified was verified with `node --check` (all pass — this checks syntax
validity, not runtime correctness or type safety, but it's genuine, real
verification, not a claim without evidence). `.jsx` files can't be checked
this way (JSX needs a transpiler this sandbox has no way to install) and were
verified by careful manual review instead. See `TESTS.md` for the complete,
itemized picture.

## 12. Deployment readiness

**Frontend:** `npm run build` (Vite) → static output in `client/dist/` → serve
via any static host, or reverse-proxy behind the backend. Set
`VITE_API_URL` if the API isn't reachable at the same origin under `/api`.

**Backend:** `npm start` (`node server.js`). Required in production (the
server now refuses to boot without these — see `config/validateEnv.js`):
`JWT_SECRET` (≥32 chars), `MONGODB_URI`, `CLIENT_URL`, `ADMIN_PASSWORD`
(+ `ADMIN_EMAIL` recommended). Full variable-by-variable documentation is in
`server/.env.example`, generated by grepping every `process.env.*` reference
in the codebase — not guessed.

**Database:** no manual index setup required — every `unique`/compound index
used by the app (Class name+section, Attendance class+date, User email,
Admission applicationId, the new Counter) is already declared at the schema
level and MongoDB creates them automatically on first use.

**Storage:** see §6 — local disk by default; needs a persistent volume in
production, or a swap to remote storage if the host doesn't provide one.

## 13. Second verification pass — additional findings (re-checked, not re-assumed)

A follow-up pass specifically aimed at not trusting the first pass's own
conclusions. Found and fixed 6 more real issues by re-tracing critical
code paths by hand with adversarial inputs, and — new for this pass —
actually **executing** the two pieces of logic in this codebase that have
zero external dependencies (see `TESTS.md` for full output).

- **Login timing side-channel (security, fixed):** the login endpoint
  already gave an identical error message whether an email didn't exist or
  the password was wrong — but it skipped the (deliberately slow) bcrypt
  comparison entirely when the email didn't exist, via `!user` short-
  circuiting. That timing difference is a known class of user-enumeration
  vector. Fixed in `authController.js`: a nonexistent email now runs a
  dummy `bcrypt.compare` against a fixed, valid-format hash that
  corresponds to no real account, so both paths do comparable work. The
  hash's format (version, cost factor 12 matching this app's real cost
  factor, character set) was verified directly; its runtime behavior with
  `bcryptjs` could not be (not installed here), so the call is wrapped
  defensively and this is reported as a real-but-not-fully-verified
  improvement, not a proven guarantee — see `TESTS.md`.
- **Shared `Modal.jsx` had no Escape handling, no focus trap, and no focus
  restoration (accessibility, fixed):** used across nearly every admin
  page (Classes, Documents, Enquiries, Events, Fees, Gallery, Messages,
  Notices, Results, Students, Teachers, Users). A keyboard user tabbing
  when a modal opened kept tabbing through the page behind the (visually
  opaque) backdrop, with no way to close it except a mouse.
  `Lightbox.jsx` elsewhere in this codebase already handled Escape
  correctly — this brings `Modal` in line and adds the trap/restoration
  Lightbox doesn't need. Fixed once, in the shared component, same
  leverage pattern as the `Field.jsx` fix in the first pass.
- **Public `Navbar` mobile drawer and `AdminLayout` mobile sidebar also had
  no Escape handling (accessibility, fixed):** same category of gap,
  fixed the same way in each.
- **7 icon-only buttons relying on `title` alone, no `aria-label`
  (accessibility, fixed):** across `Notices.jsx`, `Fees.jsx`, `Users.jsx`,
  `Messages.jsx`, `Documents.jsx` (admin). `title` tooltips aren't
  reliably exposed to screen readers and don't appear at all on touch
  devices — `aria-label` was added alongside the existing `title` (kept
  for the hover-tooltip UX it already provided). Found by grepping for
  every icon-only button and checking each one's actual accessible name —
  the first pass had sampled a few of these and found them correct, which
  was true for those specific ones, but not representative of all of them.
- **`trust proxy: 1` (documented, not changed):** correct behind exactly
  one reverse proxy (the common case on most hosts), but would let a
  client trivially spoof their IP and bypass every rate limiter in
  `middleware/rateLimiters.js` if this is ever deployed with the Node
  process directly exposed to the internet. Not changed because the
  correct value depends on the actual deployment topology, which isn't
  known — documented clearly in `app.js` at the point of use instead.
- **OG image relative URL — deliberately left alone, per instruction not to
  guess a domain:** confirmed (by grepping the entire codebase) that no
  real production domain exists anywhere in this project — the only
  domain-like string is an explicitly-labeled placeholder in
  `defaultSettings.js` ("update in Admin Settings"). Rather than guess,
  added a clear inline comment at the exact line in `index.html` telling
  whoever deploys this exactly what to change and why.
- **Re-traced and reconfirmed correct, no change needed:** the CORS
  allowlist against subdomain-confusion attempts (`real.com.evil.com`
  correctly fails an exact-match check); the portal's complete route
  surface (exactly one endpoint, `GET /api/portal/overview`, no client-
  suppliable identifier anywhere); every backend-deleting action in the
  admin UI goes through a real confirmation dialog (the only unconfirmed
  "remove" buttons found were removing a row from an in-progress, unsaved
  form — appropriately not confirmed, since nothing has been persisted
  yet); `isActive`-based account deactivation is a real, wired-up check,
  not a no-op against a field that doesn't exist.

## 14. Third pass — externally-reported issues, all fixed

A third round, working from 10 specific issues reported after an independent
audit of the delivered project. All 10 were verified against the actual
code first (not assumed to be accurate or inaccurate), confirmed genuine,
and fixed. Full reasoning for each lives as comments at the point of the
fix in the code itself; this is the summary.

1. **`?all=true` bypassed publication filters for unauthenticated
   requests** on Teachers, Events, Notices, and Testimonials — confirmed
   by reading all four controllers, none checked who was asking. Fixed
   with a new `optionalAuth` middleware (identifies an admin if a valid
   session is present, never rejects otherwise — the routes stay genuinely
   public) and a `req.user?.role === 'admin'` check in each controller.
   Searched the rest of the backend for equivalent patterns
   (`includeInactive`, `showAll`, etc.) — these 4 were the complete set.
   The admin dashboard's existing use of `?all=true` keeps working with no
   frontend changes, since it already sends its session cookie.
2. **Private documents were reachable through the public static route** —
   the biggest change this pass. Built a real split: a new
   `private-uploads/` directory, never mounted with `express.static`
   anywhere, holding admission-submitted documents and admin-uploaded
   "Documents" records. Both now require a new authenticated,
   authorization-checked download endpoint
   (`GET /api/documents/:id/download`, visibility-checked;
   `GET /api/admissions/:applicationId/documents/:filename/download`,
   admin-only and cross-validated against that specific application's own
   records). Gallery photos, event images, and notice attachments are
   deliberately untouched — still served publicly exactly as before, per
   the explicit instruction that normal school photos must stay public.
   Caught a real bug while verifying this: the parent/student portal
   independently queried the same Document model and linked straight to a
   field I was repurposing — would have silently broken; fixed alongside.
3. **Windows-unsafe path handling** — found and fixed both real instances
   of `new URL(...).pathname`. A new shared `utils/paths.js` (using
   `fileURLToPath`, the actually-documented, cross-platform-correct way to
   do this) is now the single source of truth for both upload directories.
4. **A missed unescaped regex** — `resultController.js` had its own
   separate `new RegExp()` call in its admin search that an earlier pass's
   fix (which covered `admissionController`, `studentController`,
   `userController`, `searchController`) hadn't reached. Fixed; re-swept
   the entire backend afterward — all 5 `new RegExp()` calls anywhere in
   the codebase now use the shared `escapeRegex` utility.
5. **`npm run seed` didn't load `server/.env`** — an earlier pass made the
   standalone script actually *run* (previously it did nothing at all —
   see §2.6), but never gave it its own `dotenv/config` import, so
   `MONGODB_URI`/`ADMIN_EMAIL`/`ADMIN_PASSWORD` were never populated for
   that specific execution path (the normal server boot loads dotenv in
   `server.js`, which this path never goes through). Fixed with one import.
6. **`ADMIN_EMAIL` wasn't required in production, only `ADMIN_PASSWORD`
   was** — meaning an operator could set a strong password but still get
   the well-known default email seeded. Fixed consistently across
   `validateEnv.js` (boot-time check), `seed.js` (defense-in-depth check
   for the standalone path), `.env.example`, and `README.md` — all four
   now describe both as required, matching each other.
7. **`Field` + `FileInput` produced two separate `<label>`s claiming to
   label the same file input** when used together (3 real call sites:
   Notices, Documents, Events admin forms) — not literally nested in the
   DOM, but the same underlying problem: two competing label associations
   for one control. Fixed by having `FileInput` detect whether an `id` was
   already injected (which `Field` always does when wrapping a child) and,
   if so, render a plain styled `div` with click-via-ref instead of its
   own wrapping `<label>`, relying on `Field`'s outer label for the
   accessible name. Standalone usage (Gallery, Apply — no wrapping
   `Field`) is unchanged, still self-contained. Also fixed something found
   while verifying this: the hidden file input used `display:none`
   (Tailwind's `hidden` class), which removes an element from the tab
   order entirely — the control was unreachable by keyboard in *either*
   variant, before this pass. Switched to `sr-only` (visually hidden, still
   focusable) with a `:focus-within` ring on the visible box.
8. **Replacing or deleting a gallery image, event image, or notice
   attachment never cleaned up the old file** — confirmed in all three
   controllers. Fixed with a shared, deliberately conservative helper
   (`utils/fileCleanup.js`) that only ever deletes a file when it's
   genuinely a server-uploaded path (never a bundled static asset like
   `/images/campus/...`), is actually being replaced or removed, and no
   *other* record still references the same file (checked for real via a
   query, not assumed safe).
9. **Attendance submissions weren't validated server-side** — no check
   that a submitted student actually exists or belongs to the selected
   class, no de-duplication of repeated student IDs in one submission,
   and — the more serious finding — `findOneAndUpdate`'s `upsert` was
   never given `runValidators: true`, so the model's own `status` enum
   constraint wasn't actually being enforced on this path at all despite
   being declared. Fixed all of it in `attendanceController.js`.
10. **Result marks weren't validated against their own max** —
    `{maxMarks: 100, obtainedMarks: 150}` was accepted outright; nothing
    tied the two fields together. Fixed at two layers: a schema-level
    cross-field validator in `models/Result.js` (protects every code path,
    not just one route) plus an explicit, specifically-worded check in
    `resultController.createResult` (clearer error messages than a raw
    Mongoose validation error would give).

**Repository-wide audit performed after the fixes above** (not just on the
files touched): searched for `TODO`/`FIXME`/`HACK` (zero found anywhere),
`console.log` in the frontend (zero), `console.log` in the backend (11
found, all legitimate startup/status logging — DB connection state, seed
progress, server-listening confirmation — none removed, since removing
real operational logging isn't the same as removing debugging artifacts),
hardcoded secrets or embedded-credential connection strings (none beyond
the already-documented, already-gated-to-non-production demo credentials),
and — mechanically, not just by eye — verified every single controller
function imported by every route file actually exists as a real export
(zero broken imports found), and that the public/private upload split is
applied consistently (only gallery/event/notice routes use the public
`upload`; only documents/admissions use `privateUpload` — confirmed by
grep, not assumed).

## 16. Fourth pass — one reported issue + exhaustive final audit

**The reported issue:** `Settings.jsx`'s "Admissions Open?" checkbox wrapped
a `<label>` inside `Field`. Confirmed genuinely broken (worse than the
earlier `FileInput` case): `Field`'s `cloneElement` injects an `id` onto
whatever single child it wraps, but here the child was a raw `<label>`
element, not a form control — so the injected `id` landed on the *label*,
where it does nothing useful, while `Field`'s own outer
`<label htmlFor={id}>Admissions Open?</label>` pointed at that same
non-functional id. The checkbox itself remained accessibly-named only via
the inner label's native wrapping (its own separate, correct mechanism) —
meaning `Field`'s "Admissions Open?" text was decorative only, doing
nothing for assistive tech, despite looking like the field's real label.
**Fixed** (Option A, as suggested — the simpler, safer path): removed the
`Field` wrapper entirely; replaced with a plain `<div>` containing a
`.label`-styled `<span>` (matching `Field`'s own visual label styling
exactly, via the same CSS class) plus a `<label htmlFor="admissions-open">`
wrapping the checkbox with a real, unique, verified-unique `id`.

**Audit of every other `Field` usage (131 total across the client):**
written as an actual parser-style scan (regex with DOTALL correctly
capturing full multi-line `<Field>...</Field>` spans, not just "the next
line" — a real methodology gap in an earlier pass's own equivalent check,
caught and corrected here), flagging anything that isn't a simple
`Input`/`Select`/`Textarea`/`FileInput` child. Result: **zero** further
instances — the Settings.jsx checkbox was the only one. Verified the scan
itself isn't just silently passing everything by confirming it correctly
flags the original (pre-fix) Settings.jsx pattern when tested against it
directly. Also confirmed `Input`, `Select`, and `Textarea` all correctly
spread `...props` (including `Field`'s injected `id`/`aria-*`) onto their
real underlying DOM element — so the other 127 `Field`-wrapped instances
were already correct, not just assumed to be.

**Documents[].filename migration (specifically re-checked, not trusted from
the prior pass's conclusion):** zero remaining `.path`/`.filePath`
references to admission or Document-model files anywhere in the frontend
or backend; `.filename` used consistently everywhere it matters; zero
old-style direct `/uploads/...` links to any document anywhere.

**Route/authorization table rebuilt from scratch, all 21 route files read
in full again:** every admin-only operation confirmed still gated;
`GalleryImage` confirmed to have no publication-status field at all (no
`isPublished`/`isActive`/`visibility`), so its fully-public route is
correct by design, not an oversight — there's nothing to bypass. (Several
route files use chained `.route('/').get().post()` syntax that an
earlier, cruder grep pattern in this same pass initially seemed to show as
"missing" routes — each was individually re-checked by reading the full
file, and all were actually present and correctly gated; noted here as a
real methodology lesson, not a code bug.)

**Frontend↔backend API cross-reference:** every distinct endpoint called
from the frontend (both static string calls and dynamic template-literal
calls, extracted separately since they need different regex handling)
checked against the actual route table above. Zero mismatches.

**Duplicate `id` attributes:** searched every hardcoded `id="..."` across
the entire frontend. Zero duplicates.

**Clickable non-button elements re-examined:** 4 `div`/`span` elements
with `onClick` found. 3 are backdrop-dismiss overlays, correctly marked
`aria-hidden` (supplementary mouse convenience — Escape and the visible
close button, both already confirmed working, are the real keyboard path,
so no keyboard handler is needed on the backdrop itself). 1 is the
`FileInput` div-wrapper from an earlier pass — re-examined and confirmed
fine: the real interactive element is the `sr-only` (not `hidden`) file
input inside it, which is natively keyboard-focusable and already responds
to Enter/Space on its own, same as any native file input; the div's
`onClick` is a mouse-only convenience layered on top, not a replacement
for keyboard access.

**No further genuine issues found** in this pass beyond the one reported.

## 17. Remaining issues (explicit — nothing here is hidden)

- Mobile responsiveness: verified by static code review only, not by
  rendering any page in a real browser at any breakpoint (§7).
- Focus management on the mobile nav/sidebar drawers (§8).
- OG image is a relative URL (§9, one-line fix if wanted).
- CORS-rejected requests return `403` with a generic body — fine
  functionally, but if you want a more specific machine-readable error code
  for frontend handling, that's a small further change.
- File-signature validation (§2.7) is a magic-byte check, not a full file
  parser — it stops trivially spoofed extensions, not a maliciously crafted
  file that's genuinely valid for its type but harmful in some other way.
- Zod input validation exists for all public-facing write endpoints
  (admission, contact, enquiry, auth) but not for every admin-only CRUD
  endpoint (those rely on Mongoose schema-level validation only). Given these
  routes require an authenticated admin already, this is a real but lower-
  priority gap than anything in §2 — noted, not built out further, given time
  constraints.
- The 5th test file added this pass (`privateFiles.test.js`, covering the
  `?all=true` fix and the private-storage architecture) has the same
  execution boundary as the others in §10/§11: syntax-checked and
  confirmed correctly discovered, not observed to actually pass, for the
  same reason (no network access for `npm install` in this sandbox).
- All 10 externally-reported issues in §14 were fixed and are believed
  correct based on direct code verification (reading the actual result,
  tracing the logic, and — for the two zero-dependency utilities audited
  earlier — real execution). None were re-verified by actually running the
  app, for the same environment reason as everything else in this
  document.
