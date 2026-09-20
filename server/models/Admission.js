import mongoose from 'mongoose';
import { nextSequence } from './Counter.js';

const statusHistory = new mongoose.Schema({
  status: String, at: { type: Date, default: Date.now }, by: { type: String, default: 'System' }, note: String,
}, { _id: false });

const admissionSchema = new mongoose.Schema({
  applicationId: { type: String, unique: true, index: true },
  studentName: { type: String, required: true, trim: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  classApplyingFor: { type: String, required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  guardianName: { type: String, default: '' },
  phone: { type: String, required: true, index: true },
  email: { type: String, default: '' },
  address: {
    line1: String, city: String, district: String, state: String, pincode: String,
  },
  previousSchool: { type: String, default: '' },
  previousClass: { type: String, default: '' },
  previousResult: { type: String, default: '' },
  documents: [{ label: String, filename: String, originalName: String, _id: false }],
  status: { type: String, enum: ['Submitted', 'Under Review', 'Shortlisted', 'Approved', 'Rejected'], default: 'Submitted', index: true },
  notes: { type: String, default: '' },
  statusHistory: [statusHistory],
}, { timestamps: true });

admissionSchema.index({ studentName: 'text', applicationId: 'text' });
admissionSchema.pre('validate', async function (next) {
  if (!this.applicationId) {
    // Atomic sequence — safe under concurrent submissions. The previous
    // `countDocuments() + 1` approach could read the same count from two
    // simultaneous requests and generate a duplicate applicationId, which
    // would then fail on the unique index with a confusing 500 for one of
    // the two applicants. See PROJECT_AUDIT.md.
    const year = new Date().getFullYear();
    const seq = await nextSequence('admissionApplicationId');
    this.applicationId = `RPS-${year}-${String(seq).padStart(4, '0')}`;
  }
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [{ status: 'Submitted', by: 'Applicant' }];
  }
  next();
});
export const Admission = mongoose.model('Admission', admissionSchema);
