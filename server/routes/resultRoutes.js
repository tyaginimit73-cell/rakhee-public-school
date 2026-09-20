import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { resultCheckLimiter } from '../middleware/rateLimiters.js';
import { validate, resultCheckSchema } from '../validators/index.js';
import { checkResult, listResults, createResult, deleteResult } from '../controllers/resultController.js';

const router = Router();
router.post('/check', resultCheckLimiter, validate(resultCheckSchema), checkResult);
router.use(protect, authorize('admin'));
router.route('/').get(listResults).post(createResult);
router.delete('/:id', deleteResult);
export default router;
