import { Class } from '../models/Class.js';
import { Student } from '../models/Student.js';
import { Teacher } from '../models/Teacher.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Phase 4A: a class may be created WITHOUT a class teacher (the frontend
// offers an empty option and always has), but when one IS supplied it must
// point at a Teacher that actually exists. Class.classTeacher drives the
// teacher portal's class scoping (utils/teacherScope.js), so a dangling id
// here would silently distort which teacher owns which class. Format is
// already guaranteed by classCreateSchema/classUpdateSchema; this is the
// existence half of the same check (same convention as
// userController.validateStudentIds/validateTeacherId).
const assertClassTeacherExists = async (classTeacher) => {
  if (!classTeacher) return; // null/absent = no teacher assigned — allowed, as before
  const exists = await Teacher.exists({ _id: classTeacher });
  if (!exists) throw new ApiError(404, `Teacher not found: ${classTeacher}`);
};

export const listClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find().populate('classTeacher', 'name').sort('name section');
  const counts = await Student.aggregate([{ $match: { status: 'active' } }, { $group: { _id: '$class', count: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  const items = classes.map((c) => ({ ...c.toObject(), studentCount: map[String(c._id)] || 0 }));
  res.json({ success: true, data: { items } });
});

export const createClass = asyncHandler(async (req, res) => {
  await assertClassTeacherExists(req.body.classTeacher);
  const cls = await Class.create(req.body);
  res.status(201).json({ success: true, message: 'Class created', data: cls });
});

export const updateClass = asyncHandler(async (req, res) => {
  // Only checked when the field is actually part of this update — a partial
  // PUT that doesn't touch classTeacher must not be affected.
  if (Object.prototype.hasOwnProperty.call(req.body, 'classTeacher')) {
    await assertClassTeacherExists(req.body.classTeacher);
  }
  const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!cls) throw new ApiError(404, 'Class not found');
  res.json({ success: true, message: 'Class updated', data: cls });
});

export const deleteClass = asyncHandler(async (req, res) => {
  const students = await Student.countDocuments({ class: req.params.id });
  if (students > 0) throw new ApiError(400, `Cannot delete: ${students} student(s) are enrolled in this class`);
  const cls = await Class.findByIdAndDelete(req.params.id);
  if (!cls) throw new ApiError(404, 'Class not found');
  res.json({ success: true, message: 'Class deleted' });
});
