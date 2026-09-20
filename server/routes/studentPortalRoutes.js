import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getMyOverview } from '../controllers/studentPortalController.js';

const router = Router();
// Deliberately no :studentId anywhere on this router — see
// controllers/studentPortalController.js for why that's the point, not
// an oversight.
router.get('/overview', protect, authorize('student'), getMyOverview);
export default router;
