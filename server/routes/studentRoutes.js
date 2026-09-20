import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { listStudents, getStudent, createStudent, updateStudent, deleteStudent } from '../controllers/studentController.js';

const router = Router();
router.use(protect, authorize('admin', 'teacher'));
router.route('/').get(listStudents).post(createStudent);
router.route('/:id').get(getStudent).put(updateStudent).delete(authorize('admin'), deleteStudent);
export default router;
