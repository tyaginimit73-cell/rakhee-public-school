# TESTS.md — Rakhee Public School

This document exists because the README previously claimed "Verified Test
Coverage (automated smoke suite)" when no test files or test framework
existed at all. That claim is now removed. This document says, precisely,
what was and wasn't verified, and how — so it doesn't happen again.

## The one constraint that governs everything below

This sandbox has **no network access**. Confirmed directly, not assumed:

```
$ curl -s -m 5 -D - -o /dev/null https://registry.npmjs.org/express
HTTP/2 403
x-deny-reason: host_not_allowed
```

`npm install` in `server/` fails the same way (`403 Forbidden` fetching
packages from the registry). The upload also did not include `node_modules`
for either `client/` or `server/`. The practical effect: **nothing that
requires an installed dependency could be executed in this sandbox** — no
`npm run build`, no `npm run dev`, no running either app, no running the test
suite. Everything below is scoped around that hard limit.

## What actually ran, in this sandbox, with evidence

### `node --check` — every backend `.js` file created or modified
This is real syntax validation using the Node binary that's actually present
(`v22.22.2`), independent of any package install. Ran individually and then
swept across the entire `server/` tree:

```
$ find . -name "*.js" -not -path "*/node_modules/*" -not -path "*/uploads/*" \
    | while read -r f; do node --check "$f" || echo "FAIL: $f"; done
---SYNTAX SWEEP DONE---
```

No failures. This confirms every changed backend file is syntactically valid
JavaScript — it does **not** confirm runtime correctness, type safety, or
that the logic is right; only that it parses.

### `node --check` — the one plain-JS frontend file
`client/src/hooks/usePageMeta.js` — passes. Every other frontend file touched
is `.jsx`; Node's `--check` doesn't recognize the extension at all (JSX isn't
valid JS syntax without a transpiler, and there's no network access here to
install Babel/SWC/Vite to get one). Those files were verified by careful
manual review instead — re-reading the full file after each edit, checking
brace/tag balance and import correctness by hand. That is a real but weaker
form of verification than a tool actually parsing the file, and it's reported
as such rather than implied to be equivalent.

### The test suite's own discoverability and dependency boundary
Ran `npm test` (`node --test`) in `server/` twice, deliberately:

1. **First attempt** used `"test": "node --test tests/"` in `package.json`.
   This failed with `MODULE_NOT_FOUND` trying to `require()` the literal path
   `.../server/tests` as a module — i.e. the directory-argument form of
   `node --test <dir>` does not do discovery the way I'd assumed on this
   Node version. **This was a real bug in the test script itself**, caught
   only by actually trying to run it.
2. Fixed to `"test": "node --test"` (bare — Node's built-in convention-based
   discovery, which correctly finds files under `tests/`). Re-ran:

```
$ npm test
> node --test
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'mongodb-memory-server'
imported from '.../server/tests/helpers/testServer.js'
```

This is the **expected and correct** failure point: the test files are
correctly discovered and loaded (imports resolve up to the first missing
package), and the only thing stopping full execution is the absence of
`node_modules` — exactly the environment constraint stated above, not a bug
in the tests. `mongodb-memory-server` is already a declared dependency in
`package.json` (not something newly added) — in a normal environment with
network access, `npm install` would fetch it and this would proceed.

One additional wrinkle worth stating plainly: `mongodb-memory-server` itself
downloads a real MongoDB binary on first use (or uses one already cached on
the machine). That download also needs network access. So even in an
environment where `npm install` succeeds, the very first `npm test` run
needs network once, for that binary — documented here so it isn't a surprise.

### Runtime APIs the tests depend on — individually confirmed present
The tests use Node's global `fetch`, `FormData`, `Blob`, and
`Headers.prototype.getSetCookie` (to read the session cookie out of a login
response without a browser). These needed to be confirmed as real in this
Node version rather than assumed:

```
$ node -e "console.log(typeof fetch, typeof FormData, typeof Blob, typeof Headers)"
function function function function
$ node -e "const h = new Headers(); console.log(typeof h.getSetCookie)"
function
```

All present natively in Node 22 — no additional package needed for the test
*infrastructure* itself, only for `mongodb-memory-server` (already a declared
dependency) and the app's own existing dependencies (`express`, `mongoose`,
etc.).

## Verification pass #2 — what changed since the first report

This section covers a second, more skeptical pass, done specifically to
avoid trusting the first pass's own conclusions. It found and fixed 6 more
real issues (a login timing side-channel, missing focus-trap/Escape
handling on the shared Modal and both mobile drawers, and 7 icon-only
buttons relying on `title` alone instead of `aria-label`) and, more
importantly, **executed real code for the first time** rather than relying
on syntax-checking and manual review alone.

### Newly executed (not just syntax-checked) — with results

Two of this project's new utilities have zero external dependencies, which
means — unlike everything else — they could actually be run in this
sandbox, with real assertions, against real inputs:

```
$ node test_escapeRegex.mjs
PASS: escapes parentheses (would otherwise throw as invalid regex)
PASS: a crafted ReDoS-style pattern is neutralized into a literal string
PASS: ordinary search text is untouched
PASS: empty/undefined input does not throw
PASS: all documented special characters are escaped
5 passed, 0 failed
```

```
$ node test_fileSignature.mjs
PASS: genuine PNG with .png extension is accepted
PASS: genuine JPEG with .jpg extension is accepted
PASS: genuine PDF with .pdf extension is accepted
PASS: genuine DOCX (zip header) with .docx extension is accepted
PASS: THE ACTUAL ATTACK: plain text renamed to .jpg is REJECTED
PASS: a PNG renamed to .pdf (content/extension mismatch) is REJECTED
PASS: a genuine PNG checked against the WRONG expected extension is REJECTED
PASS: a nonexistent file does not throw, returns false
8 passed, 0 failed
```

The second one is the more important result: it used real files with real
magic bytes (created with Python's `struct`/raw bytes, not mocked), including
the literal attack this code exists to stop — plain text renamed to `.jpg` —
and confirms it's actually rejected, not just that the code parses.

This is genuinely stronger evidence than the first pass had for anything,
and it's reported as its own category rather than folded into "syntax
checked" — the two are not the same claim.

### Environment re-confirmed, not assumed, before relying on it again

Re-ran the network check (still `403`/`host_not_allowed` from
`registry.npmjs.org`) and additionally checked `unpkg.com`, `cdn.jsdelivr.net`,
`raw.githubusercontent.com`, and `github.com` directly — all `403`. This
wasn't assumed to still be true from the first pass; it was checked again,
fresh, before this report relied on it. `npm install` and `npm test` were
also re-run fresh in `server/`: identical results to the first pass
(`403` on install; test suite correctly discovered and blocked at the same
`mongodb-memory-server` import, not a new or different failure).

### A weak but real additional static check — balanced delimiters

`node --check` still can't parse `.jsx`. As a (deliberately labeled as weak)
supplementary check, every `.jsx` file created or modified across both
passes — 24 files — was checked for balanced `{}`, `()`, and `[]` counts.
All 24 balanced, zero mismatches. This does not catch most real bugs (wrong
variable names, logic errors, misplaced attributes) — it only catches gross
structural corruption. It's reported as exactly that: real evidence, of a
narrow and limited kind, not a substitute for a parser or a test run.

### New test case added
`auth.test.js` gained a case exercising the new login-timing fix directly:
a login attempt for an email that doesn't exist at all still returns `401`
with the same `"Invalid email or password"` message (confirming the new
dummy-hash comparison branch doesn't crash or behave differently) — it
cannot verify the timing-equalization itself (that would need to actually
measure response latency, which needs the app running, which needs the
blocked `npm install`).

### The 4 original test files — re-inspected specifically for meaningfulness
Re-read `health.test.js`, `auth.test.js`, `admission.test.js`, `cors.test.js`
again, specifically checking for the failure mode explicitly warned against:
tests that only check a function exists, or assert something trivially
true regardless of correctness. None found — every assertion checks an
actual outcome (a status code, a specific field being absent, a set of IDs
being unique, a response header's exact value) that would fail if the
corresponding fix were reverted. This is a claim about the tests' design,
not a claim that they were observed passing — see above for that boundary.



None of these have been run end-to-end against a live instance of the app.
They are syntax-valid (see above) and were reasoned through carefully by
hand, but "carefully reasoned through" and "actually observed to pass" are
different claims, and only the second one is a real test result.

| File | What it checks |
|---|---|
| `tests/health.test.js` | `/api/health` returns 200; unknown routes return a clean 404 (no stack trace); malformed JSON body returns 400 not 500 |
| `tests/auth.test.js` | Login succeeds with correct credentials and sets an httpOnly cookie; login fails with wrong password; login for an email that doesn't exist at all fails the same way (doesn't crash the new timing-equalization branch); `/api/auth/me` rejects requests with no session; `/api/auth/me` succeeds with a valid session cookie; an admin-only route rejects an unauthenticated request |
| `tests/admission.test.js` | Valid submission returns a correctly-formatted ID and an upload token; **8 concurrent submissions never produce duplicate IDs** (direct regression test for the race-condition fix); tracking requires the correct phone, not just the ID; tracking response never contains `notes` or `statusHistory[].by` (direct regression test for the field-exposure fix); document upload is rejected with no token; rejected when the token belongs to a *different* application; succeeds with the correct token; a file whose content doesn't match its claimed extension is rejected; admin-only admission list rejects unauthenticated requests |
| `tests/cors.test.js` | In production mode, a disallowed origin is rejected (403, no permissive `Access-Control-Allow-Origin` echoed back); the configured `CLIENT_URL` origin is allowed; multiple comma-separated origins in `CLIENT_URL` both work; requests with no `Origin` header at all (curl, server-to-server) still succeed |
| `tests/privateFiles.test.js` | `?all=true` does NOT bypass the publication filter for an unauthenticated request (the actual vulnerability); an authenticated admin's `?all=true` still works (the feature isn't just broken outright); a submitted admission document is confirmed NOT reachable via the old public `/uploads/<filename>` route; both new download endpoints reject unauthenticated requests |

### To actually run these — for real, with real results
```
cd server
npm install
npm test
```
That's the whole thing. No extra setup, no separate test database to
provision — `tests/helpers/testServer.js` spins up an in-memory MongoDB per
run and tears it down after.

## What was never attempted, and why

- **Frontend build (`npm run build` in `client/`):** blocked by the same
  missing-`npm install` constraint. Never claimed to have run.
- **Any actual browser rendering** — mobile breakpoints, visual QA, focus
  order, actual screen-reader behavior: no browser or rendering tool is
  available in this sandbox at all. The accessibility and responsiveness fixes
  in this pass are based on reading the code (React semantics, ARIA
  attributes, the actual CSS rules applied) — real analysis, but not the same
  as observing a rendered page.
- **Full E2E browser flows** (the 7 scenarios suggested in the original
  brief — homepage → admission submit → track → login → admin dashboard →
  CRUD → portal): would need Playwright or similar, which would be both a new
  dependency (blocked by no network) and something needing an actual browser
  (not available here regardless). Not attempted, not claimed.

## Fourth pass — mechanical verification, not new test files

No new test files were added this pass (the one reported issue was a
frontend accessibility fix with no new backend behavior to test). Instead,
several one-off verification scripts were written and actually run — real
evidence, distinct from the syntax-checking/manual-review categories above:

- A Python script parsing every `<Field>...</Field>` span across all 131
  usages in the client (proper multi-line regex, not line-proximity
  grepping), flagging any that don't wrap a simple `Input`/`Select`/
  `Textarea`/`FileInput`. Run against the actual codebase: zero flagged.
  Separately run against a copy of the *original, pre-fix* Settings.jsx
  checkbox pattern to confirm the script actually catches it: correctly
  flagged. This second run is what makes "zero flagged" in the real
  codebase trustworthy rather than a silent no-op.
- A duplicate-`id` search across every `.jsx` file: zero duplicates.
- A frontend-to-backend API cross-reference: every distinct endpoint
  called from the client (static and template-literal calls extracted
  separately) checked against the actual route table (rebuilt by reading
  all 21 route files again in full). Zero mismatches.

The two zero-dependency utilities from an earlier pass
(`escapeRegex`, `fileSignature`) were re-run fresh this pass too: 5/5 and
8/8 passing, unchanged. `npm test` re-attempted fresh: same result as
every prior pass — 5 test files correctly discovered, blocked at the same
expected `mongodb-memory-server` import (no network access for
`npm install` in this sandbox, confirmed unchanged).

## Bottom line

Real, working, dependency-free tests exist now, covering the security and
correctness fixes made in this pass specifically (not generic boilerplate
tests). They are believed correct based on careful reasoning and every form
of static verification available without network access. They have **not**
been observed to pass, because this sandbox cannot install the packages
needed to run them. Run `npm install && npm test` in `server/` to get a real
answer.
