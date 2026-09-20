import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { publicFormLimiter } from '../middleware/rateLimiters.js';
import { validate, contactSchema } from '../validators/index.js';
import { submitContact, listMessages, toggleRead, deleteMessage } from '../controllers/contactController.js';

const router = Router();
router.post('/', publicFormLimiter, validate(contactSchema), submitContact);
router.use(protect, authorize('admin'));
router.get('/', listMessages);
router.patch('/:id/read', toggleRead);
router.delete('/:id', deleteMessage);
export default router;
