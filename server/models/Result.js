import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  maxMarks: { type: Number, required: true, default: 100, min: [1, 'maxMarks must be a positive number'] },
  obtainedMarks: {
    type: Number,
    required: true,
    min: [0, 'obtainedMarks cannot be negative'],
    validate: {
      // `this` is the subject subdocument here, so this.maxMarks is the
      // sibling field on the same subject entry — this is what actually
      // stops maxMarks=100 / obtainedMarks=150 from being saved; nothing
      // previously tied these two fields together at all. Schema-level
      // (rather than only in the controller) so it's enforced on every
      // code path that creates or updates a Result, not just one route —
      // see resultController.js for the controller-level check too, which
      // exists for a clearer, per-subject error message.
      validator: function (value) { return value <= this.maxMarks; },
      message: 'obtainedMarks cannot exceed maxMarks for the same subject',
    },
  },
}, { _id: false });

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  exam: { type: String, required: true },          // e.g. "Annual Examination"
  session: { type: String, required: true },       // e.g. "2025-26"
  subjects: [subjectSchema],
  totalMax: Number,
  totalObtained: Number,
  percentage: Number,
  grade: String,
  status: { type: String, enum: ['Pass', 'Fail'], default: 'Pass' },
  published: { type: Boolean, default: true },
}, { timestamps: true });

resultSchema.pre('save', function (next) {
  this.totalMax = this.subjects.reduce((s, x) => s + x.maxMarks, 0);
  this.totalObtained = this.subjects.reduce((s, x) => s + x.obtainedMarks, 0);
  this.percentage = this.totalMax ? Math.round((this.totalObtained / this.totalMax) * 1000) / 10 : 0;
  const p = this.percentage;
  this.grade = p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B+' : p >= 60 ? 'B' : p >= 50 ? 'C' : p >= 40 ? 'D' : 'E';
  this.status = p >= 40 && this.subjects.every((s) => s.obtainedMarks >= s.maxMarks * 0.33) ? 'Pass' : 'Fail';
  next();
});
export const Result = mongoose.model('Result', resultSchema);
