import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { overview } from '../controllers/dashboardController.js';

const router = Router();
router.get('/overview', protect, authorize('admin'), overview);
export default router;
