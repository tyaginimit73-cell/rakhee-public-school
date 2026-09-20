import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, enum: ['Notice', 'Circular', 'Admission', 'Result', 'General'], default: 'General' },
  filePath: { type: String, required: true },
  originalName: { type: String, default: '' },
  size: { type: Number, default: 0 },
  visibility: { type: String, enum: ['public', 'admin'], default: 'admin' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
export const Document = mongoose.model('Document', documentSchema);
