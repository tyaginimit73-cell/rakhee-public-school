// Shared setup for the integration tests in this folder. Starts the *real*
// Express app (server/app.js — the same file server.js boots in
// production) against an in-memory MongoDB, on an OS-assigned free port.
//
// Deliberately does NOT import server.js or config/db.js: those own the
// production boot sequence (validateEnv, connectDB, app.listen on a fixed
// PORT). Tests need their own isolated, disposable database and port, so
// this connects to Mongo directly and imports only the Express app.
//
// ESM note: app.js reads several process.env values at import time (via
// config/cors.js and middleware/rateLimiters.js), so required env vars
// must be set *before* `import('../../app.js')` runs — a plain top-level
// `import` would be hoisted above any setup code. Using a dynamic
// `import()` inside this async function is what makes the ordering safe.

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod;
let server;

export const startTestServer = async () => {
  process.env.JWT_SECRET ||= 'test-only-secret-please-change-me-1234567890';
  process.env.NODE_ENV ||= 'test';
  process.env.SEED_DEMO_DATA = 'false'; // each test creates only the fixtures it needs

  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const { app } = await import('../../app.js');
  server = app.listen(0); // 0 = OS picks a free port
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
};

export const stopTestServer = async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongod.stop();
};

// mongodb-memory-server downloads a real mongod binary the first time it
// runs on a given machine (or uses one already cached locally). That
// download needs network access. See TESTS.md for why these tests could
// not be executed inside the sandbox this project was built in.
