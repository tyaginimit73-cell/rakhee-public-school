import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { listUsers, createUser, updateUser, deleteUser, toggleUser, resetUserPassword } from '../controllers/userController.js';
import { validate, userCreateSchema, userUpdateSchema, userResetPasswordSchema } from '../validators/index.js';

const router = Router();
router.use(protect, authorize('admin'));
router.route('/').get(listUsers).post(validate(userCreateSchema), createUser);
router.route('/:id').put(validate(userUpdateSchema), updateUser).delete(deleteUser);
router.patch('/:id/toggle', toggleUser);
router.patch('/:id/password', validate(userResetPasswordSchema), resetUserPassword);
export default router;
