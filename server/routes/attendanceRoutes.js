import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getRoster, markAttendance, studentSummary, todayCount } from '../controllers/attendanceController.js';

const router = Router();
router.use(protect, authorize('admin', 'teacher'));
router.get('/roster', getRoster);
router.post('/mark', markAttendance);
router.get('/today', authorize('admin'), todayCount); // school-wide aggregate, not scoped to any class — not "teacher-appropriate" per the class-scoping requirement, so admin only
router.get('/student/:studentId', studentSummary);
export default router;
