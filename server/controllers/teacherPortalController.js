import { Class } from '../models/Class.js';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getAssignedClassIds, isClassAssignedToTeacher } from '../utils/teacherScope.js';

export const getMyProfile = asyncHandler(async (req, res) => {
  // req.user.teacher is already the full populated Teacher document
  // (middleware/auth.js populates it) — no need to re-fetch it by id.
  if (!req.user.teacher) throw new ApiError(404, 'No teacher profile linked to this account yet. Please contact the school office.');
  res.json({ success: true, data: req.user.teacher });
});

// "Assigned classes" = Class.classTeacher === this teacher — see
// utils/teacherScope.js for why that's the definition used, rather than a
// new assignment concept. Goes through the same getAssignedClassIds used
// for the authorization checks elsewhere in this file, rather than
// duplicating the query here — one definition of "assigned," not two that
// could quietly drift apart.
export const listMyClasses = asyncHandler(async (req, res) => {
  const ids = await getAssignedClassIds(req.user.teacher);
  const classes = ids.length ? await Class.find({ _id: { $in: ids } }).sort('name section') : [];
  res.json({ success: true, data: { classes } });
});

// Students within one of the teacher's OWN assigned classes. classId is a
// URL param, but — same pattern as the parent portal's studentId — it's
// only ever honored after checking it's actually one of this teacher's
// own assignments, never trusted on its own. This is the backend
// enforcement the frontend route guard alone can't provide.
export const listClassStudents = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  if (!(await isClassAssignedToTeacher(req.user.teacher, classId))) {
    throw new ApiError(403, 'You are not assigned to this class');
  }
  const students = await Student.find({ class: classId, status: 'active' }).populate('class', 'name section').sort('firstName lastName');
  res.json({ success: true, data: { students } });
});
