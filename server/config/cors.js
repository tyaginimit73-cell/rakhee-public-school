// Strict, production-safe CORS origin allowlist.
//
// The previous implementation checked the origin against CLIENT_URL, but
// then called `callback(null, true)` unconditionally regardless of the
// result of that check — so every origin was allowed, including in
// production, while `credentials: true` was also set. That combination
// lets any website's JavaScript make authenticated, credentialed requests
// against this API. See PROJECT_AUDIT.md.
//
// CLIENT_URL may be a single origin or a comma-separated list, e.g.
//   CLIENT_URL=https://www.rakheepublicschool.in,https://rakheepublicschool.in

const DEV_DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const parseAllowedOrigins = () => {
  const configured = (process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV !== 'production') {
    // Dev convenience only — never applied in production.
    return Array.from(new Set([...configured, ...DEV_DEFAULT_ORIGINS]));
  }
  return configured;
};

export const corsOptions = {
  origin: (origin, callback) => {
    const allowed = parseAllowedOrigins();
    // No Origin header (same-origin requests, curl, server-to-server,
    // mobile webviews) — allow through; there's no browser origin to check.
    if (!origin) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};
