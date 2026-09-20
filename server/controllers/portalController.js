import { Student } from '../models/Student.js';
import { Result } from '../models/Result.js';
import { Fee } from '../models/Fee.js';
import { Notice } from '../models/Notice.js';
import { Event } from '../models/Event.js';
import { Document } from '../models/Document.js';
import { Attendance } from '../models/Attendance.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Aggregated portal dashboard for the logged-in parent/student
export const portalOverview = asyncHandler(async (req, res) => {
  const user = req.user;
  const base = { notices: await Notice.find({ isPublished: true }).sort('-publishDate').limit(6),
    events: await Event.find({ isPublished: true, date: { $gte: new Date(Date.now() - 864e5) } }).sort('date').limit(4) };

  if (!user.student) {
    return res.json({ success: true, data: { ...base, student: null, message: 'No student profile linked to this account yet. Please contact the school office.' } });
  }
  const student = await Student.findById(user.student._id || user.student).populate('class', 'name section');
  if (!student) throw new ApiError(404, 'Linked student record not found');

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

  const documents = await Document.find({ visibility: 'public' }).select('-filePath').sort('-createdAt').limit(10);

  res.json({
    success: true,
    data: {
      ...base,
      student,
      results,
      fees,
      documents,
      attendance: {
        overall: { present, absent, late, total, percentage: total ? Math.round(((present + late * 0.5) / total) * 1000) / 10 : 0 },
        byMonth: Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6),
      },
    },
  });
});
