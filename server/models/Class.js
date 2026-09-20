import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },       // e.g. "Class 8"
  section: { type: String, required: true, trim: true, default: 'A' },
  level: { type: String, enum: ['Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Senior Secondary'], default: 'Primary' },
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  subjects: [{ type: String }],
  capacity: { type: Number, default: 40 },
}, { timestamps: true });

classSchema.index({ name: 1, section: 1 }, { unique: true });
export const Class = mongoose.model('Class', classSchema);
