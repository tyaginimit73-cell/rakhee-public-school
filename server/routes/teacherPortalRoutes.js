import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getMyProfile, listMyClasses, listClassStudents } from '../controllers/teacherPortalController.js';

const router = Router();
router.use(protect, authorize('teacher'));
router.get('/profile', getMyProfile);
router.get('/classes', listMyClasses);
router.get('/classes/:classId/students', listClassStudents);
export default router;
