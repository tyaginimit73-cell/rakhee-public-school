import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { listUsers, createUser, updateUser, deleteUser, toggleUser, resetUserPassword } from '../controllers/userController.js';
import { validate, userCreateSchema } from '../validators/index.js';

const router = Router();
router.use(protect, authorize('admin'));
router.route('/').get(listUsers).post(validate(userCreateSchema), createUser);
router.route('/:id').put(updateUser).delete(deleteUser);
router.patch('/:id/toggle', toggleUser);
router.patch('/:id/password', resetUserPassword);
export default router;
