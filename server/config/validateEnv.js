// Fail fast, at boot, on configuration that would otherwise misbehave
// silently later (a confusing 500 on first login, or CORS "working" only
// because it doesn't actually check anything). See PROJECT_AUDIT.md.
//
// Kept intentionally small: it checks for *presence and shape*, never
// prints secret values (RULE 9 / the audit's Phase 0 instruction).

const isProd = process.env.NODE_ENV === 'production';

export const validateEnv = () => {
  const errors = [];

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is not set. Authentication cannot work without it.');
  } else if (isProd && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET is too short for production (use at least 32 random characters).');
  }

  if (isProd) {
    if (!process.env.MONGODB_URI) {
      errors.push(
        'MONGODB_URI is not set. In production this app refuses to fall back to the ' +
        'in-memory demo database (data would be lost on every restart, and the seeded ' +
        'admin account uses a well-known default password). Set MONGODB_URI to a real ' +
        'MongoDB connection string.',
      );
    }
    if (!process.env.CLIENT_URL) {
      errors.push(
        'CLIENT_URL is not set. In production, CORS defaults to allowing no cross-origin ' +
        'requests at all, which will likely break the frontend. Set CLIENT_URL to your ' +
        'deployed frontend origin(s), comma-separated if there is more than one.',
      );
    }
    if (!process.env.ADMIN_PASSWORD) {
      errors.push(
        'ADMIN_PASSWORD is not set. In production this app will not seed an admin account ' +
        'using the hardcoded demo default. Set ADMIN_EMAIL and ADMIN_PASSWORD explicitly.',
      );
    }
    if (!process.env.ADMIN_EMAIL) {
      errors.push(
        'ADMIN_EMAIL is not set. In production this app will not seed the initial admin ' +
        'account using the well-known default email (admin@rps.school) — set ADMIN_EMAIL ' +
        'explicitly, even if ADMIN_PASSWORD is already set.',
      );
    }
  }

  if (errors.length) {
    console.error('\n🚫 Cannot start: invalid environment configuration:\n');
    errors.forEach((e) => console.error(`   • ${e}`));
    console.error('\nSee server/.env.example for the full list of variables.\n');
    process.exit(1);
  }
};
