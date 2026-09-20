import { Enquiry } from '../models/Enquiry.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paged } from '../utils/paginate.js';
import { queryParam } from '../validators/index.js';

export const submitEnquiry = asyncHandler(async (req, res) => {
  await Enquiry.create(req.body);
  res.status(201).json({ success: true, message: 'Enquiry submitted! Our admissions team will contact you shortly.' });
});

export const listEnquiries = asyncHandler(async (req, res) => {
  // queryParam() drops operator-style objects (?status[$ne]=x) — Phase 4A.
  const status = queryParam(req.query.status);
  const filter = status ? { status } : {};
  const data = await paged(Enquiry.find(filter).sort('-createdAt'), req, Enquiry.countDocuments(filter));
  res.json({ success: true, data });
});

export const updateEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!enquiry) throw new ApiError(404, 'Enquiry not found');
  res.json({ success: true, message: 'Enquiry updated', data: enquiry });
});

export const deleteEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
  if (!enquiry) throw new ApiError(404, 'Enquiry not found');
  res.json({ success: true, message: 'Enquiry deleted' });
});
