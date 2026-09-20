import mongoose from 'mongoose';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paged } from '../utils/paginate.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { getAssignedClassIds, isStudentAssignedToTeacher, isClassAssignedToTeacher } from '../utils/teacherScope.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Teacher write-scoping (see PROJECT_AUDIT.md Phase 1 / H1):
// The ONLY fields a teacher may modify on a student in one of their assigned
// classes — contact/guardian details a class teacher legitimately corrects.
// Everything else is rejected outright (not silently stripped) so a teacher
// client can never mass-assign its way past the whitelist.
const TEACHER_EDITABLE_STUDENT_FIELDS = ['firstName', 'lastName', 'phone', 'email', 'address', 'fatherName', 'motherName', 'bloodGroup'];

export const listStudents = asyncHandler(async (req, res) => {
  const { classId, search = '', status } = req.query;
  const filter = {};
  if (classId) {
    if (!isValidObjectId(classId)) throw new ApiError(400, 'Invalid class ID format');
    filter.class = classId;
  }
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { rollNumber: rx }];
  }
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
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid student ID format');
  if (req.user.role === 'teacher' && !(await isStudentAssignedToTeacher(req.user.teacher, id))) {
    throw new ApiError(403, 'This student is not in one of your assigned classes');
  }
  const student = await Student.findById(id).populate('class', 'name section');
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
});

export const createStudent = asyncHandler(async (req, res) => {
  // Teachers may only add students to a class they are actually assigned to
  // (class-scoped, same rule as every other teacher write path). Admins are
  // unrestricted. No current frontend workflow creates students as a teacher
  // (verified: only the admin Students page calls this), so this is pure
  // server-side authorization, not a behavior change for any real UI flow.
  if (req.user.role === 'teacher') {
    const classId = req.body?.class;
    if (!classId || !isValidObjectId(classId)) {
      throw new ApiError(400, 'A valid class is required to add a student');
    }
    if (!(await isClassAssignedToTeacher(req.user.teacher, classId))) {
      throw new ApiError(403, 'You can only add students to classes you are assigned to');
    }
  }
  const student = await Student.create(req.body);
  res.status(201).json({ success: true, message: 'Student added', data: student });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid student ID format');
  if (req.user.role === 'teacher') {
    if (!(await isStudentAssignedToTeacher(req.user.teacher, id))) {
      throw new ApiError(403, 'This student is not in one of your assigned classes');
    }
    // Strict field whitelist for teachers. Security-sensitive fields — class
    // (moves the student between authorization scopes), rollNumber (the lookup
    // key for results/fees), dob (the shared secret for the public result-check
    // endpoint), status, gender, admissionDate, plus any unknown/arbitrary
    // field — are rejected with a clear 400 rather than silently dropped.
    // Account linkage lives on the User model, not Student, so it is not
    // reachable through this endpoint by any role. Admins keep full updates.
    const provided = Object.keys(req.body || {});
    const rejected = provided.filter((k) => !TEACHER_EDITABLE_STUDENT_FIELDS.includes(k));
    if (rejected.length) {
      throw new ApiError(400, `Teachers cannot modify the following field(s): ${rejected.join(', ')}. Only contact/guardian details can be updated by a teacher.`);
    }
    if (!provided.length) throw new ApiError(400, 'No editable fields were provided');
  }
  const student = await Student.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, message: 'Student updated', data: student });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid student ID format');
  const student = await Student.findByIdAndDelete(id);
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, message: 'Student deleted' });
});
