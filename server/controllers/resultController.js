import { Result } from '../models/Result.js';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paged } from '../utils/paginate.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { queryParam } from '../validators/index.js';

const toDateStr = (d) => new Date(d).toISOString().slice(0, 10);

// Public: check result by roll number + DOB
export const checkResult = asyncHandler(async (req, res) => {
  const { rollNumber, dob } = req.body;
  const student = await Student.findOne({ rollNumber: rollNumber.trim().toUpperCase() }).populate('class', 'name section');
  if (!student) throw new ApiError(404, 'No student found with this roll number');
  try {
    if (toDateStr(student.dob) !== toDateStr(dob)) throw new Error();
  } catch {
    throw new ApiError(401, 'Date of birth does not match our records');
  }
  const result = await Result.findOne({ student: student._id, published: true }).sort('-createdAt');
  if (!result) throw new ApiError(404, 'Result has not been published yet for this student');
  res.json({ success: true, data: { result, student: { name: student.fullName, rollNumber: student.rollNumber, class: student.class } } });
});

// Admin
export const listResults = asyncHandler(async (req, res) => {
  const filter = {};
  // queryParam() drops operator-style objects — Phase 4A.
  const search = queryParam(req.query.search);
  if (search) {
    const students = await Student.find({ rollNumber: new RegExp(escapeRegex(search), 'i') }).select('_id');
    filter.student = { $in: students.map((s) => s._id) };
  }
  const data = await paged(
    Result.find(filter).populate({ path: 'student', select: 'firstName lastName rollNumber class', populate: { path: 'class', select: 'name section' } }).sort('-createdAt'),
    req, Result.countDocuments(filter),
  );
  res.json({ success: true, data });
});

export const createResult = asyncHandler(async (req, res) => {
  const { rollNumber, exam, session, subjects, published = true } = req.body;
  const student = await Student.findOne({ rollNumber: (rollNumber || '').trim().toUpperCase() });
  if (!student) throw new ApiError(404, `No student found with roll number ${rollNumber}`);
  if (!Array.isArray(subjects) || subjects.length === 0) throw new ApiError(400, 'Add at least one subject');

  // Checked explicitly here (not just left to the model's schema
  // validators — see models/Result.js) so a bad subject gets one clear,
  // specific message instead of a generic Mongoose validation error.
  // Previously nothing checked this at all: {maxMarks:100,
  // obtainedMarks:150} was accepted outright, silently producing a >100%
  // result.
  for (const s of subjects) {
    const max = Number(s.maxMarks);
    const obtained = Number(s.obtainedMarks);
    if (!s.name || typeof s.name !== 'string' || !s.name.trim()) throw new ApiError(400, 'Every subject needs a name');
    if (!Number.isFinite(max) || max <= 0) throw new ApiError(400, `"${s.name}": maxMarks must be a positive number`);
    if (!Number.isFinite(obtained) || obtained < 0) throw new ApiError(400, `"${s.name}": obtainedMarks must be zero or a positive number`);
    if (obtained > max) throw new ApiError(400, `"${s.name}": obtainedMarks (${obtained}) cannot exceed maxMarks (${max})`);
  }

  const result = await Result.create({ student: student._id, exam, session, subjects, published });
  res.status(201).json({ success: true, message: 'Result published', data: result });
});

export const deleteResult = asyncHandler(async (req, res) => {
  const result = await Result.findByIdAndDelete(req.params.id);
  if (!result) throw new ApiError(404, 'Result not found');
  res.json({ success: true, message: 'Result deleted' });
});
