import { Router } from 'express';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { upload, verifyUploadedFiles } from '../middleware/upload.js';
import { listNotices, createNotice, updateNotice, deleteNotice } from '../controllers/noticeController.js';

const router = Router();
router.get('/', optionalAuth, listNotices); // public notice board; ?all=true requires an authenticated admin
router.use(protect, authorize('admin'));
router.post('/', upload.single('attachment'), verifyUploadedFiles, createNotice);
router.put('/:id', upload.single('attachment'), verifyUploadedFiles, updateNotice);
router.delete('/:id', deleteNotice);
export default router;
