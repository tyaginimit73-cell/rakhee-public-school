import mongoose from 'mongoose';
import { Teacher } from '../models/Teacher.js';
import { User } from '../models/User.js';
import { Class } from '../models/Class.js';
import { ApiError } from '../utils/ApiError.js';
import { queryParam } from '../validators/index.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
import { asyncHandler } from '../utils/asyncHandler.js';

export const listTeachers = asyncHandler(async (req, res) => {
  const { all } = req.query;
  // queryParam() drops operator-style objects (?department[$ne]=x) — Phase 4A.
  const department = queryParam(req.query.department);
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
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid teacher ID format');
  const teacher = await Teacher.findById(id);
  if (!teacher) throw new ApiError(404, 'Teacher not found');

  // Safe-deletion guard (PROJECT_AUDIT.md Phase 2 / L6), same pattern as
  // classController.deleteClass: refuse instead of dangling references.
  // Complete reference audit of every model in models/:
  //   User.teacher (teacher login accounts) and Class.classTeacher
  //   (which drives the teacher portal's class scoping) — nothing else
  //   links here. No related record is ever auto-deleted.
  const [linkedUsers, assignedClasses] = await Promise.all([
    User.countDocuments({ teacher: id }),
    Class.countDocuments({ classTeacher: id }),
  ]);
  const deps = [];
  if (linkedUsers) deps.push(`${linkedUsers} linked user account(s)`);
  if (assignedClasses) deps.push(`${assignedClasses} assigned class(es)`);
  if (deps.length) {
    throw new ApiError(400, `Cannot delete this teacher: still referenced by ${deps.join(', ')}. Delete or reassign those records first.`);
  }

  await Teacher.findByIdAndDelete(id);
  res.json({ success: true, message: 'Teacher deleted' });
});
