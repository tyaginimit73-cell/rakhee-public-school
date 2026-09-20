import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { listClasses, createClass, updateClass, deleteClass } from '../controllers/classController.js';

const router = Router();
router.get('/', listClasses);
router.use(protect, authorize('admin'));
router.post('/', createClass);
router.route('/:id').put(updateClass).delete(deleteClass);
export default router;
