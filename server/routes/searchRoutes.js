import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { globalSearch } from '../controllers/searchController.js';

const router = Router();
router.get('/', protect, authorize('admin'), globalSearch);
export default router;
