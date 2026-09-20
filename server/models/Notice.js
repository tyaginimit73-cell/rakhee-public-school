import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Academic', 'Examination', 'Admission', 'Holiday', 'General', 'Event', 'News'], default: 'General', index: true },
  attachmentName: { type: String, default: '' },
  attachmentPath: { type: String, default: '' },
  isImportant: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  publishDate: { type: Date, default: Date.now, index: true },
}, { timestamps: true });
noticeSchema.index({ title: 'text', description: 'text' });
export const Notice = mongoose.model('Notice', noticeSchema);
