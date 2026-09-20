import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { listFees, createFee, addPayment, deleteFee } from '../controllers/feeController.js';

const router = Router();
router.use(protect, authorize('admin'));
router.route('/').get(listFees).post(createFee);
router.post('/:id/payments', addPayment);
router.delete('/:id', deleteFee);
export default router;
