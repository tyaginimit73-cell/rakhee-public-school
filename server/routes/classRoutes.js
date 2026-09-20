import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, classCreateSchema, classUpdateSchema } from '../validators/index.js';
import { listClasses, createClass, updateClass, deleteClass } from '../controllers/classController.js';

const router = Router();
router.get('/', listClasses);
router.use(protect, authorize('admin'));
router.post('/', validate(classCreateSchema), createClass);
router.route('/:id').put(validate(classUpdateSchema), updateClass).delete(deleteClass);
export default router;
