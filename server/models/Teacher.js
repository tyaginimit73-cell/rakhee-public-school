import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  photo: { type: String, default: '' },
  designation: { type: String, required: true, default: 'Teacher' },
  qualification: { type: String, required: true },
  department: { type: String, required: true, index: true },
  subjects: [{ type: String }],
  experienceYears: { type: Number, default: 0, min: 0 },
  email: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  bio: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
export const Teacher = mongoose.model('Teacher', teacherSchema);
