import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, studentCreateSchema, studentUpdateSchema } from '../validators/index.js';
import { listStudents, getStudent, createStudent, updateStudent, deleteStudent } from '../controllers/studentController.js';

const router = Router();
router.use(protect, authorize('admin', 'teacher'));
router.route('/').get(listStudents).post(validate(studentCreateSchema), createStudent);
router.route('/:id').get(getStudent).put(validate(studentUpdateSchema), updateStudent).delete(authorize('admin'), deleteStudent);
export default router;
