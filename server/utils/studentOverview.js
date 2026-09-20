import mongoose from 'mongoose';
import { Student } from '../models/Student.js';
import { Result } from '../models/Result.js';
import { Fee } from '../models/Fee.js';
import { Attendance } from '../models/Attendance.js';
import { Notice } from '../models/Notice.js';
import { Event } from '../models/Event.js';
import { Document } from '../models/Document.js';
import { ApiError } from './ApiError.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getStudentOverview = async (studentId) => {
  if (!isValidObjectId(studentId)) throw new ApiError(400, 'Invalid student ID format');
  const student = await Student.findById(studentId).populate('class', 'name section');
  if (!student) throw new ApiError(404, 'Student record not found');

  const [results, fees, attendanceDocs] = await Promise.all([
    Result.find({ student: student._id, published: true }).sort('-createdAt').limit(5),
    Fee.find({ student: student._id }).sort('-createdAt'),
    Attendance.find({ 'records.student': student._id }).select('date records'),
  ]);

  let present = 0, absent = 0, late = 0;
  const months = {};
  attendanceDocs.forEach((doc) => {
    const rec = doc.records.find((r) => String(r.student) === String(student._id));
    if (!rec) return;
    const m = doc.date.slice(0, 7);
    months[m] = months[m] || { month: m, Present: 0, Absent: 0, Late: 0 };
    months[m][rec.status] += 1;
    if (rec.status === 'Present') present += 1; else if (rec.status === 'Absent') absent += 1; else late += 1;
  });
  const total = present + absent + late;

  return {
    student,
    results,
    fees,
    attendance: {
      overall: { present, absent, late, total, percentage: total ? Math.round(((present + late * 0.5) / total) * 1000) / 10 : 0 },
      byMonth: Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6),
    },
  };
};

export const getSharedPortalContent = async () => {
  const [notices, events, documents] = await Promise.all([
    Notice.find({ isPublished: true }).sort('-publishDate').limit(6),
    Event.find({ isPublished: true, date: { $gte: new Date(Date.now() - 864e5) } }).sort('date').limit(4),
    Document.find({ visibility: 'public' }).select('-filePath').sort('-createdAt').limit(10),
  ]);
  return { notices, events, documents };
};
