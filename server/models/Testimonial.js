import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, default: 'Parent' },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });
export const Testimonial = mongoose.model('Testimonial', testimonialSchema);
