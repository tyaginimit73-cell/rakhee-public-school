import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  dob: { type: Date, required: true },
  rollNumber: { type: String, required: true, unique: true, trim: true, index: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  admissionDate: { type: Date, default: Date.now },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, trim: true, default: '' },
  address: {
    line1: String, city: String, district: String, state: String, pincode: String,
  },
  bloodGroup: { type: String, default: '' },
  status: { type: String, enum: ['active', 'alumni', 'inactive'], default: 'active', index: true },
}, { timestamps: true });

studentSchema.index({ firstName: 'text', lastName: 'text', rollNumber: 'text' });
studentSchema.virtual('fullName').get(function () { return `${this.firstName} ${this.lastName}`.trim(); });
studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });
export const Student = mongoose.model('Student', studentSchema);
