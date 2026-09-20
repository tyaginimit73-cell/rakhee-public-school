import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  classInterested: { type: String, default: '' },
  message: { type: String, default: '' },
  source: { type: String, default: 'Website' },
  status: { type: String, enum: ['New', 'Contacted', 'Closed'], default: 'New', index: true },
}, { timestamps: true });
export const Enquiry = mongoose.model('Enquiry', enquirySchema);
