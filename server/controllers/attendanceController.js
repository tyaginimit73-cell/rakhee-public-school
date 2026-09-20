import mongoose from 'mongoose';
import { Attendance } from '../models/Attendance.js';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isClassAssignedToTeacher, isStudentAssignedToTeacher } from '../utils/teacherScope.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET roster for a class + date (merges saved statuses)
export const getRoster = asyncHandler(async (req, res) => {
  const { classId, date } = req.query;
  if (!classId || !date) throw new ApiError(400, 'classId and date are required');
  if (!isValidObjectId(classId)) throw new ApiError(400, 'Invalid class ID format');
  if (req.user.role === 'teacher' && !(await isClassAssignedToTeacher(req.user.teacher, classId))) {
    throw new ApiError(403, 'You are not assigned to this class');
  }
  const students = await Student.find({ class: classId, status: 'active' }).sort('rollNumber');
  const saved = await Attendance.findOne({ class: classId, date });
  const statusMap = Object.fromEntries((saved?.records || []).map((r) => [String(r.student), r.status]));
  const roster = students.map((s) => ({
    studentId: s._id, name: s.fullName, rollNumber: s.rollNumber, status: statusMap[String(s._id)] || 'Present',
  }));
  res.json({ success: true, data: { roster, saved: !!saved } });
});

const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Late'];

export const markAttendance = asyncHandler(async (req, res) => {
  const { classId, date, records } = req.body;
  if (!classId || !date || !Array.isArray(records)) throw new ApiError(400, 'classId, date and records are required');
  if (!isValidObjectId(classId)) throw new ApiError(400, 'Invalid class ID format');
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) throw new ApiError(400, 'date must be in YYYY-MM-DD format');
  if (req.user.role === 'teacher' && !(await isClassAssignedToTeacher(req.user.teacher, classId))) {
    throw new ApiError(403, 'You are not assigned to this class');
  }

  const seen = new Set();
  const clean = [];
  for (const r of records || []) {
    if (!r?.studentId || !isValidObjectId(r.studentId)) {
      throw new ApiError(400, `Invalid student ID: ${r?.studentId}`);
    }
    if (!ATTENDANCE_STATUSES.includes(r.status)) {
      throw new ApiError(400, `Invalid status "${r.status}" — must be one of ${ATTENDANCE_STATUSES.join(', ')}`);
    }
    const id = String(r.studentId);
    if (seen.has(id)) continue;
    seen.add(id);
    clean.push({ student: r.studentId, status: r.status });
  }
  if (!clean.length) throw new ApiError(400, 'At least one valid attendance record is required');

  const validCount = await Student.countDocuments({ _id: { $in: clean.map((r) => r.student) }, class: classId });
  if (validCount !== clean.length) {
    throw new ApiError(400, 'One or more students do not exist or are not enrolled in the selected class');
  }

  const doc = await Attendance.findOneAndUpdate(
    { class: classId, date },
    { class: classId, date, records: clean, markedBy: req.user._id },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
  res.json({ success: true, message: `Attendance saved for ${clean.length} students`, data: doc });
});

// Summary for one student (used by portal + admin)
export const studentSummary = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId;
  if (!isValidObjectId(studentId)) throw new ApiError(400, 'Invalid student ID format');
  if (req.user.role === 'teacher' && !(await isStudentAssignedToTeacher(req.user.teacher, studentId))) {
    throw new ApiError(403, 'This student is not in one of your assigned classes');
  }
  const docs = await Attendance.find({ 'records.student': studentId }).select('date records');
  let present = 0, absent = 0, late = 0;
  const months = {};
  docs.forEach((doc) => {
    const rec = doc.records.find((r) => String(r.student) === studentId);
    if (!rec) return;
    const month = doc.date.slice(0, 7);
    months[month] = months[month] || { month, Present: 0, Absent: 0, Late: 0 };
    months[month][rec.status] += 1;
    if (rec.status === 'Present') present += 1;
    else if (rec.status === 'Absent') absent += 1;
    else late += 1;
  });
  const total = present + absent + late;
  res.json({
    success: true,
    data: {
      overall: { present, absent, late, total, percentage: total ? Math.round(((present + late * 0.5) / total) * 1000) / 10 : 0 },
      byMonth: Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6),
    },
  });
});

export const todayCount = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const docs = await Attendance.find({ date: today });
  let present = 0, total = 0;
  docs.forEach((d) => d.records.forEach((r) => { total += 1; if (r.status === 'Present' || r.status === 'Late') present += 1; }));
  res.json({ success: true, data: { present, total, marked: docs.length } });
});
