import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { upload, verifyUploadedFiles } from '../middleware/upload.js';
import { validate, galleryCreateSchema, galleryUpdateSchema } from '../validators/index.js';
import { listGallery, createGalleryImage, updateGalleryImage, deleteGalleryImage } from '../controllers/galleryController.js';

const router = Router();
router.get('/', listGallery);
router.use(protect, authorize('admin'));
router.post('/', upload.single('image'), verifyUploadedFiles, validate(galleryCreateSchema), createGalleryImage);
router.route('/:id').put(upload.single('image'), verifyUploadedFiles, validate(galleryUpdateSchema), updateGalleryImage).delete(deleteGalleryImage);
export default router;
