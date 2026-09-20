import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, feeCreateSchema } from '../validators/index.js';
import { listFees, createFee, addPayment, deleteFee } from '../controllers/feeController.js';

const router = Router();
router.use(protect, authorize('admin'));
router.route('/').get(listFees).post(validate(feeCreateSchema), createFee);
router.post('/:id/payments', addPayment);
router.delete('/:id', deleteFee);
export default router;
