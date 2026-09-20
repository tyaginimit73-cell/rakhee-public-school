import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  caption: { type: String, default: '' },
  category: { type: String, required: true, default: 'Campus', index: true },
  imagePath: { type: String, required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });
export const GalleryImage = mongoose.model('GalleryImage', gallerySchema);
