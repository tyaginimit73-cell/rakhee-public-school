import { Router } from 'express';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { listTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from '../controllers/testimonialController.js';

const router = Router();
router.get('/', optionalAuth, listTestimonials); // public testimonials; ?all=true requires an authenticated admin
router.use(protect, authorize('admin'));
router.post('/', createTestimonial);
router.route('/:id').put(updateTestimonial).delete(deleteTestimonial);
export default router;
