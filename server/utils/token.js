import jwt from 'jsonwebtoken';

// `passwordVersion` (optional, defaults to 0) is embedded as the `pv` claim
// and checked against the user document on every authenticated request —
// see middleware/auth.js and the note on User.passwordVersion in models/User.js.
// Keeping it optional in the signature means any caller that doesn't know the
// version still produces a token that validates for never-rotated accounts.
export const signToken = (userId, passwordVersion = 0) =>
  jwt.sign({ id: userId, pv: passwordVersion || 0 }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ---------- cookie lifetime follows the JWT lifetime (PROJECT_AUDIT.md Phase 3 / L2) ----------
// Previously the auth cookie's maxAge was hardcoded to 7 days while the JWT
// lifetime was configurable via JWT_EXPIRES_IN — lowering the token lifetime
// left stale cookies behind, raising it logged users out early. The cookie
// now derives its maxAge from the SAME configured value, with the same 7-day
// default, so the two can no longer drift apart.

const DEFAULT_JWT_EXPIRES_IN = '7d'; // identical default to signToken's `|| '7d'` above
// Documented safe fallback for an invalid/unparseable JWT_EXPIRES_IN: the
// same 7-day default the token itself falls back to — never longer.
export const COOKIE_FALLBACK_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// jsonwebtoken accepts `expiresIn` as a number of SECONDS or as a string in
// vercel/ms format ("7d", "12h", "30m", "90s", "2 days"; a bare numeric
// STRING means milliseconds — that quirk is mirrored on purpose so the
// cookie never outlives the token it carries). This parser reproduces those
// semantics and returns milliseconds, or null for anything it cannot
// understand — callers then use the documented fallback above instead of
// guessing at a lifetime.
const UNIT_MS = {
  ms: 1, msec: 1, msecs: 1, millisecond: 1, milliseconds: 1,
  s: 1000, sec: 1000, secs: 1000, second: 1000, seconds: 1000,
  m: 60_000, min: 60_000, mins: 60_000, minute: 60_000, minutes: 60_000,
  h: 3_600_000, hr: 3_600_000, hrs: 3_600_000, hour: 3_600_000, hours: 3_600_000,
  d: 86_400_000, day: 86_400_000, days: 86_400_000,
  w: 7 * 86_400_000, week: 7 * 86_400_000, weeks: 7 * 86_400_000,
  y: 365.25 * 86_400_000, year: 365.25 * 86_400_000, years: 365.25 * 86_400_000,
};

export const jwtLifetimeMs = (value = process.env.JWT_EXPIRES_IN) => {
  if (value === undefined || value === null || value === '') value = DEFAULT_JWT_EXPIRES_IN;
  if (typeof value === 'number') {
    // jsonwebtoken: a bare NUMBER means seconds
    return Number.isFinite(value) && value > 0 ? Math.round(value * 1000) : null;
  }
  if (typeof value !== 'string') return null;
  const match = String(value).trim().match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)$/);
  if (!match) return null;
  const amount = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === '') return amount > 0 ? Math.round(amount) : null; // bare string = ms (ms/jwt quirk, mirrored)
  const factor = UNIT_MS[unit];
  if (!factor) return null; // unknown unit — never guess
  return amount > 0 ? Math.round(amount * factor) : null;
};

export const setAuthCookie = (res, token) => {
  let maxAge = jwtLifetimeMs();
  if (!maxAge) {
    // Invalid/unparseable JWT_EXPIRES_IN — use the documented 7-day fallback
    // and say so loudly rather than silently picking some lifetime.
    console.warn(`[auth] JWT_EXPIRES_IN=${JSON.stringify(process.env.JWT_EXPIRES_IN)} is not a recognized duration — auth cookie maxAge falling back to 7 days.`);
    maxAge = COOKIE_FALLBACK_MAX_AGE_MS;
  }
  res.cookie('rps_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
  });
};
export const clearAuthCookie = (res) => res.clearCookie('rps_token');



// Short-lived, narrowly-scoped token that authorizes document uploads for
// exactly one admission application. Issued once, in the response to a
// successful submission, and consumed by the immediate follow-up upload
// call the same browser session makes. This replaces "anyone who knows or
// guesses the applicationId can upload files to it" (the applicationId is
// a predictable sequential string, not a secret) with "you must possess
// the token that was only ever returned to the person who just submitted
// this specific application." See PROJECT_AUDIT.md.
const UPLOAD_TOKEN_PURPOSE = 'admission-docs';
const UPLOAD_TOKEN_TTL = '60m';

export const signAdmissionUploadToken = (applicationId) =>
  jwt.sign({ applicationId, purpose: UPLOAD_TOKEN_PURPOSE }, process.env.JWT_SECRET, { expiresIn: UPLOAD_TOKEN_TTL });

// Returns the verified payload, or null if the token is missing/invalid/
// expired/for a different application — callers just need a yes/no.
export const verifyAdmissionUploadToken = (token, applicationId) => {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose !== UPLOAD_TOKEN_PURPOSE || payload.applicationId !== applicationId) return null;
    return payload;
  } catch {
    return null;
  }
};
