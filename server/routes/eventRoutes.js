import { Router } from 'express';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { upload, verifyUploadedFiles } from '../middleware/upload.js';
import { validate, eventCreateSchema, eventUpdateSchema } from '../validators/index.js';
import { listEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';

const router = Router();
router.get('/', optionalAuth, listEvents); // public events page; ?all=true requires an authenticated admin
router.use(protect, authorize('admin'));
router.post('/', upload.single('image'), verifyUploadedFiles, validate(eventCreateSchema), createEvent);
router.put('/:id', upload.single('image'), verifyUploadedFiles, validate(eventUpdateSchema), updateEvent);
router.delete('/:id', deleteEvent);
export default router;
