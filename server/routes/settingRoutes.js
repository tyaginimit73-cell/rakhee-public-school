import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { validate, settingsUpdateSchema } from '../validators/index.js';

const router = Router();
router.get('/', getSettings); // public — powers the whole frontend
// Schema-validated: wrong types and unknown/dangerous keys never reach the
// deep-merge. Admin-only, same as before. PROJECT_AUDIT.md Phase 2 / M4.
router.put('/', protect, authorize('admin'), validate(settingsUpdateSchema), updateSettings);
export default router;
