import { Teacher } from '../models/Teacher.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listTeachers = asyncHandler(async (req, res) => {
  const { department, all } = req.query;
  const filter = {};
  // `all=true` bypasses the public isActive filter — previously available
  // to anyone unauthenticated, now only to an actual authenticated admin
  // (req.user is only set here by the optionalAuth middleware if a valid
  // admin session was presented; see routes/teacherRoutes.js). Any other
  // caller — including a non-admin logged-in user — just gets the normal
  // public result, same as not passing the param at all.
  if (!(all && req.user?.role === 'admin')) filter.isActive = true;
  if (department) filter.department = department;
  const teachers = await Teacher.find(filter).sort('order name');
  const departments = await Teacher.distinct('department');
  res.json({ success: true, data: { items: teachers, departments } });
});

export const createTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.create(req.body);
  res.status(201).json({ success: true, message: 'Teacher added', data: teacher });
});

export const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  res.json({ success: true, message: 'Teacher updated', data: teacher });
});

export const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByIdAndDelete(req.params.id);
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  res.json({ success: true, message: 'Teacher deleted' });
});
