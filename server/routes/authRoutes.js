import { Router } from 'express';
import { login, logout, getMe, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { passwordChangeLimiter } from '../middleware/rateLimiters.js';
import { validate, loginSchema, changePasswordSchema } from '../validators/index.js';

const router = Router();
// Login's stricter rate limit (authLimiter) is applied in app.js, scoped
// to this exact path, alongside the blanket /api limiter.
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/password', protect, passwordChangeLimiter, validate(changePasswordSchema), changePassword);
export default router;
