import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import fs from 'node:fs';
import { corsOptions } from './config/cors.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiters.js';
import { notFound, errorHandler } from './middleware/error.js';
import { publicUploadDir } from './utils/paths.js';
import routes from './routes/index.js';

// Split from server.js (which now only connects to the DB and calls
// app.listen()) so tests can `import { app } from './app.js'` and drive
// it with an in-memory server + in-memory Mongo, without ever binding a
// real port or requiring a real MongoDB connection. See server/tests/.
export const app = express();

// trust the dev proxy (Vite / production reverse proxies)
// CAVEAT (found during a later security re-verification pass, not changed
// because the correct value depends on the actual deployment topology,
// which isn't known here): `1` means "trust exactly one hop of
// X-Forwarded-For" — correct behind exactly one reverse proxy/load
// balancer (the common case on most hosts, and needed for rate limiting
// and req.ip to see the real client IP rather than the proxy's). If this
// is ever deployed with the Node process directly exposed to the internet
// (no reverse proxy in front), this must be `false`/removed instead —
// otherwise a client can forge its own X-Forwarded-For header and trivially
// bypass every IP-based rate limiter in middleware/rateLimiters.js.
app.set('trust proxy', 1);

// ---------- security & infra middleware ----------
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ---------- rate limiting ----------
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);

// ---------- static uploads (PUBLIC content only — see utils/paths.js) ----------
fs.mkdirSync(publicUploadDir, { recursive: true });
app.use('/uploads', express.static(publicUploadDir, { maxAge: '7d' }));

// ---------- routes ----------
app.get('/api/health', (req, res) => res.json({ success: true, message: 'RPS API healthy', time: new Date().toISOString() }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);
