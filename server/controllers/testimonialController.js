import { Testimonial } from '../models/Testimonial.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listTestimonials = asyncHandler(async (req, res) => {
  // See teacherController.js for why this checks req.user via optionalAuth.
  const filter = (req.query.all && req.user?.role === 'admin') ? {} : { isPublished: true };
  const items = await Testimonial.find(filter).sort('-createdAt');
  res.json({ success: true, data: { items } });
});
export const createTestimonial = asyncHandler(async (req, res) => {
  const item = await Testimonial.create(req.body);
  res.status(201).json({ success: true, message: 'Testimonial added', data: item });
});
export const updateTestimonial = asyncHandler(async (req, res) => {
  const item = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) throw new ApiError(404, 'Testimonial not found');
  res.json({ success: true, message: 'Testimonial updated', data: item });
});
export const deleteTestimonial = asyncHandler(async (req, res) => {
  const item = await Testimonial.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Testimonial not found');
  res.json({ success: true, message: 'Testimonial deleted' });
});
