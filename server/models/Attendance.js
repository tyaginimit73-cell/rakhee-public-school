import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late'], required: true },
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: String, required: true },          // 'YYYY-MM-DD'
  records: [recordSchema],
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

attendanceSchema.index({ class: 1, date: 1 }, { unique: true });
attendanceSchema.index({ 'records.student': 1 });
export const Attendance = mongoose.model('Attendance', attendanceSchema);
