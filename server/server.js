import 'dotenv/config';
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { validateEnv } from './config/validateEnv.js';

const PORT = process.env.PORT || 5000;

// Fail fast on invalid configuration (missing JWT_SECRET, or missing
// MONGODB_URI/CLIENT_URL/ADMIN_PASSWORD specifically in production)
// before attempting to connect to anything. See config/validateEnv.js.
validateEnv();

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 RPS API running on http://localhost:${PORT}`));
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
