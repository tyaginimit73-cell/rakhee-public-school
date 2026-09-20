import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { portalOverview } from '../controllers/portalController.js';

const router = Router();
// Legacy endpoint — now restricted to parent/student only and uses linkedStudents
// resolution. New code should use /api/parent and /api/student routes.
// Teacher role is explicitly excluded to prevent bypassing teacher-scoped checks.
router.get('/overview', protect, authorize('parent', 'student'), portalOverview);
export default router;
