import { Router } from 'express';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { validate, teacherCreateSchema, teacherUpdateSchema } from '../validators/index.js';
import { listTeachers, createTeacher, updateTeacher, deleteTeacher } from '../controllers/teacherController.js';

const router = Router();
router.get('/', optionalAuth, listTeachers); // public faculty page; ?all=true requires an authenticated admin (checked in the controller)
router.use(protect, authorize('admin'));
router.post('/', validate(teacherCreateSchema), createTeacher);
router.route('/:id').put(validate(teacherUpdateSchema), updateTeacher).delete(deleteTeacher);
export default router;
