import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { privateUpload, verifyUploadedFiles } from '../middleware/upload.js';
import { listDocuments, uploadDocument, downloadDocument, deleteDocument } from '../controllers/documentController.js';

const router = Router();
router.get('/', protect, listDocuments); // any signed-in role sees 'public' docs
router.get('/:id/download', protect, downloadDocument); // permission checked per-document inside the controller
router.use(protect, authorize('admin'));
router.post('/', privateUpload.single('file'), verifyUploadedFiles, uploadDocument);
router.delete('/:id', deleteDocument);
export default router;
