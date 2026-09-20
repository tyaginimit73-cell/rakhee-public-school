import { GalleryImage } from '../models/GalleryImage.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cleanupReplacedPublicFile } from '../utils/fileCleanup.js';
import { queryParam } from '../validators/index.js';

export const listGallery = asyncHandler(async (req, res) => {
  // queryParam() drops operator-style objects (?category[$ne]=x) — Phase 4A.
  const category = queryParam(req.query.category);
  const filter = category ? { category } : {};
  const items = await GalleryImage.find(filter).sort('order -createdAt');
  const categories = await GalleryImage.distinct('category');
  res.json({ success: true, data: { items, categories } });
});

export const createGalleryImage = asyncHandler(async (req, res) => {
  if (!req.file && !req.body.imagePath) throw new ApiError(400, 'An image file is required');
  const image = await GalleryImage.create({
    title: req.body.title, caption: req.body.caption || '', category: req.body.category || 'Campus',
    imagePath: req.file ? `/uploads/${req.file.filename}` : req.body.imagePath,
    // galleryCreateSchema rejects malformed order values up front, so the
    // old silent `Number(...) || 0` coercion is gone: a real integer is used
    // as-is, and "no order supplied" still defaults to 0 exactly as before.
    order: req.body.order ?? 0,
  });
  res.status(201).json({ success: true, message: 'Image added to gallery', data: image });
});

export const updateGalleryImage = asyncHandler(async (req, res) => {
  const existing = await GalleryImage.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Image not found');
  const body = { title: req.body.title, caption: req.body.caption, category: req.body.category };
  if (req.file) body.imagePath = `/uploads/${req.file.filename}`;
  const image = await GalleryImage.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (req.file) await cleanupReplacedPublicFile(GalleryImage, 'imagePath', existing.imagePath, image.imagePath, image._id);
  res.json({ success: true, message: 'Image updated', data: image });
});

export const deleteGalleryImage = asyncHandler(async (req, res) => {
  const image = await GalleryImage.findByIdAndDelete(req.params.id);
  if (!image) throw new ApiError(404, 'Image not found');
  await cleanupReplacedPublicFile(GalleryImage, 'imagePath', image.imagePath, null, image._id);
  res.json({ success: true, message: 'Image deleted' });
});
