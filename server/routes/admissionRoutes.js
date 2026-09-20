import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { privateUpload, verifyUploadedFiles } from '../middleware/upload.js';
import { admissionSubmitLimiter, admissionUploadLimiter, trackingLimiter } from '../middleware/rateLimiters.js';
import { validate, admissionSchema } from '../validators/index.js';
import { submitAdmission, uploadAdmissionDocs, trackAdmission, listAdmissions, getAdmission, updateAdmissionStatus, updateAdmissionNotes, deleteAdmission, downloadAdmissionDocument } from '../controllers/admissionController.js';

const router = Router();
router.post('/', admissionSubmitLimiter, validate(admissionSchema), submitAdmission);
router.get('/track', trackingLimiter, trackAdmission);
router.post('/:applicationId/documents', admissionUploadLimiter, privateUpload.array('documents', 5), verifyUploadedFiles, uploadAdmissionDocs);
router.use(protect, authorize('admin'));
router.get('/', listAdmissions);
router.get('/:id', getAdmission);
router.get('/:applicationId/documents/:filename/download', downloadAdmissionDocument);
router.patch('/:id/status', updateAdmissionStatus);
router.patch('/:id/notes', updateAdmissionNotes);
router.delete('/:id', deleteAdmission);
export default router;
