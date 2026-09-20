import mongoose from 'mongoose';
import { Class } from '../models/Class.js';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getAssignedClassIds, isClassAssignedToTeacher } from '../utils/teacherScope.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getMyProfile = asyncHandler(async (req, res) => {
  if (!req.user.teacher) throw new ApiError(404, 'No teacher profile linked to this account yet. Please contact the school office.');
  res.json({ success: true, data: req.user.teacher });
});

export const listMyClasses = asyncHandler(async (req, res) => {
  const ids = await getAssignedClassIds(req.user.teacher);
  const classes = ids.length ? await Class.find({ _id: { $in: ids } }).sort('name section') : [];
  res.json({ success: true, data: { classes } });
});

export const listClassStudents = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  if (!isValidObjectId(classId)) {
    throw new ApiError(400, 'Invalid class ID format');
  }
  if (!(await isClassAssignedToTeacher(req.user.teacher, classId))) {
    throw new ApiError(403, 'You are not assigned to this class');
  }
  const students = await Student.find({ class: classId, status: 'active' }).populate('class', 'name section').sort('firstName lastName');
  res.json({ success: true, data: { students } });
});
