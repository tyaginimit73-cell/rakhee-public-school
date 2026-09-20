import { Student } from '../models/Student.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paged } from '../utils/paginate.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { getAssignedClassIds, isStudentAssignedToTeacher } from '../utils/teacherScope.js';

export const listStudents = asyncHandler(async (req, res) => {
  const { classId, search = '', status } = req.query;
  const filter = {};
  if (classId) filter.class = classId;
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { rollNumber: rx }];
  }
  // A teacher sees only students in their own assigned classes — the
  // whole student body was previously reachable through this same
  // admin+teacher-shared endpoint with no distinction. Admin is
  // unaffected.
  if (req.user.role === 'teacher') {
    const assigned = await getAssignedClassIds(req.user.teacher);
    if (classId && !assigned.includes(String(classId))) throw new ApiError(403, 'You are not assigned to this class');
    filter.class = classId || { $in: assigned };
  }
  const data = await paged(
    Student.find(filter).populate('class', 'name section').sort('rollNumber'), req, Student.countDocuments(filter),
  );
  res.json({ success: true, data });
});

export const getStudent = asyncHandler(async (req, res) => {
  if (req.user.role === 'teacher' && !(await isStudentAssignedToTeacher(req.user.teacher, req.params.id))) {
    throw new ApiError(403, 'This student is not in one of your assigned classes');
  }
  const student = await Student.findById(req.params.id).populate('class', 'name section');
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
});

export const createStudent = asyncHandler(async (req, res) => {
  const student = await Student.create(req.body);
  res.status(201).json({ success: true, message: 'Student added', data: student });
});

export const updateStudent = asyncHandler(async (req, res) => {
  if (req.user.role === 'teacher' && !(await isStudentAssignedToTeacher(req.user.teacher, req.params.id))) {
    throw new ApiError(403, 'This student is not in one of your assigned classes');
  }
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, message: 'Student updated', data: student });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, message: 'Student deleted' });
});
