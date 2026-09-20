import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = Router();
router.get('/', getSettings); // public — powers the whole frontend
router.put('/', protect, authorize('admin'), updateSettings);
export default router;
