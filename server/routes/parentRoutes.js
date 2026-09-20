import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { listMyChildren, getChildOverview } from '../controllers/parentController.js';

const router = Router();
router.use(protect, authorize('parent'));
router.get('/children', listMyChildren);
router.get('/children/:studentId', getChildOverview);
export default router;
