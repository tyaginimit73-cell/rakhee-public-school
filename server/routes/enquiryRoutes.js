import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { publicFormLimiter } from '../middleware/rateLimiters.js';
import { validate, enquirySchema } from '../validators/index.js';
import { submitEnquiry, listEnquiries, updateEnquiry, deleteEnquiry } from '../controllers/enquiryController.js';

const router = Router();
router.post('/', publicFormLimiter, validate(enquirySchema), submitEnquiry);
router.use(protect, authorize('admin'));
router.get('/', listEnquiries);
router.patch('/:id', updateEnquiry);
router.delete('/:id', deleteEnquiry);
export default router;
