import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { portalOverview } from '../controllers/portalController.js';

const router = Router();
router.get('/overview', protect, portalOverview);
export default router;
