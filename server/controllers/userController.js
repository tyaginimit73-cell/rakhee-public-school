import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { Teacher } from '../models/Teacher.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paged } from '../utils/paginate.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeStudentInput = (value) => {
  // Returns: undefined = field not provided, [] = explicit removal, [ids] = explicit set
  if (value === undefined) return undefined;
  if (value === null || value === '') return [];
  if (Array.isArray(value)) {
    // Filter out empty strings/nulls that might come from form; treat empty array as removal
    const cleaned = value.filter((v) => v !== null && v !== '' && v !== undefined);
    return cleaned;
  }
  // Single value (legacy student field)
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    return [trimmed];
  }
  return [];
};

const normalizeTeacherInput = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed;
  }
  return value;
};

const validateStudentIds = async (ids) => {
  if (!ids.length) return [];
  for (const id of ids) {
    if (!isValidObjectId(id)) {
      throw new ApiError(400, `Invalid student ID: ${id}`);
    }
  }
  const existing = await Student.find({ _id: { $in: ids } }).select('_id');
  const existingSet = new Set(existing.map((s) => String(s._id)));
  for (const id of ids) {
    if (!existingSet.has(String(id))) {
      throw new ApiError(404, `Student not found: ${id}`);
    }
  }
  return ids;
};

const validateTeacherId = async (teacherId) => {
  if (teacherId === null) return null;
  if (!isValidObjectId(teacherId)) {
    throw new ApiError(400, `Invalid teacher ID: ${teacherId}`);
  }
  const exists = await Teacher.exists({ _id: teacherId });
  if (!exists) throw new ApiError(404, `Teacher not found: ${teacherId}`);
  return teacherId;
};

// Last-admin protection (PROJECT_AUDIT.md Phase 1 / M5): the system must
// never end up with zero active admin accounts — there is no password-reset
// email or backdoor, so a lockout here is unrecoverable without touching the
// database directly. Throws unless at least one OTHER active admin would
// remain after the target account is removed from the active-admin set.
// `action` is only used to phrase the error message ('deleted', 'deactivated',
// 'demoted'). No-op for non-admin or already-inactive targets.
//
// Checked BEFORE the self-action checks in delete/toggle below: the acting
// user is always an active admin themselves (these routes require protect +
// authorize('admin')), so for actions on ANOTHER user this guard can never
// fire while normal admin management is happening — it only bites when the
// target genuinely is the last active admin, including an admin acting on
// their own account.
const assertNotLastActiveAdmin = async (targetUser, action) => {
  if (!targetUser || targetUser.role !== 'admin' || targetUser.isActive === false) return;
  const otherActiveAdmins = await User.countDocuments({
    role: 'admin',
    isActive: { $ne: false },
    _id: { $ne: targetUser._id },
  });
  if (otherActiveAdmins === 0) {
    throw new ApiError(
      400,
      `This account is the last active admin. It cannot be ${action} — at least one active admin account must remain.`,
    );
  }
};

export const listUsers = asyncHandler(async (req, res) => {
  const { role, search = '' } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const data = await paged(
    User.find(filter).populate('student', 'firstName lastName rollNumber').populate('students', 'firstName lastName rollNumber').populate('teacher', 'name designation department').sort('-createdAt'),
    req, User.countDocuments(filter),
  );
  res.json({ success: true, data: { ...data, items: data.items.map((u) => u.toSafeJSON()) } });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  // Whitelist only allowed fields for creation
  let studentsInput = normalizeStudentInput(
    req.body.students !== undefined ? req.body.students : req.body.student,
  );
  let teacherInput = normalizeTeacherInput(req.body.teacher);

  // Role-based clearing: only parent/student can have student links, only teacher can have teacher link
  const effectiveRole = role || 'parent';
  if (effectiveRole !== 'parent' && effectiveRole !== 'student') {
    studentsInput = [];
  }
  if (effectiveRole !== 'teacher') {
    teacherInput = null;
  }

  // Enforce single-student for student role (take first if multiple supplied)
  if (effectiveRole === 'student' && studentsInput && studentsInput.length > 1) {
    throw new ApiError(400, 'A student account can only be linked to one student record');
  }

  const validatedStudentIds = studentsInput !== undefined ? await validateStudentIds(studentsInput) : [];
  const validatedTeacherId = teacherInput !== undefined ? await validateTeacherId(teacherInput) : null;

  const payload = {
    name,
    email,
    password,
    role: effectiveRole,
    phone,
    students: validatedStudentIds,
    student: null, // legacy field always cleared on new writes; toSafeJSON will still resolve via students[]
    teacher: validatedTeacherId,
  };

  const user = await User.create(payload);
  // Populate for safe response
  await user.populate(['student', 'students', 'teacher']);
  res.status(201).json({ success: true, message: 'User created', data: user.toSafeJSON() });
});

export const updateUser = asyncHandler(async (req, res) => {
  const existingUser = await User.findById(req.params.id);
  if (!existingUser) throw new ApiError(404, 'User not found');

  // Whitelist updatable fields — password is handled via dedicated endpoint
  const { name, email, role, phone } = req.body;
  const update = {};
  if (name !== undefined) update.name = name;
  if (email !== undefined) update.email = email;
  if (role !== undefined) update.role = role;
  if (phone !== undefined) update.phone = phone;

  const newRole = role !== undefined ? role : existingUser.role;

  // Last-admin protection: demoting the last active admin locks everyone out.
  // Only relevant when the role is actually changing away from admin.
  if (role !== undefined && role !== 'admin' && existingUser.role === 'admin' && existingUser.isActive !== false) {
    await assertNotLastActiveAdmin(existingUser, 'demoted');
  }

  // Students handling: detect if field was explicitly provided
  const hasStudentsKey = Object.prototype.hasOwnProperty.call(req.body, 'students');
  const hasLegacyStudentKey = Object.prototype.hasOwnProperty.call(req.body, 'student');
  let studentsInput;
  if (hasStudentsKey) {
    studentsInput = normalizeStudentInput(req.body.students);
  } else if (hasLegacyStudentKey) {
    studentsInput = normalizeStudentInput(req.body.student);
  } else {
    studentsInput = undefined; // not provided — preserve existing
  }

  // Teacher handling
  const hasTeacherKey = Object.prototype.hasOwnProperty.call(req.body, 'teacher');
  let teacherInput = hasTeacherKey ? normalizeTeacherInput(req.body.teacher) : undefined;

  // Role-based clearing logic
  if (newRole !== 'parent' && newRole !== 'student') {
    // If role changed away from parent/student, force clear student links regardless of input
    if (studentsInput === undefined) {
      studentsInput = [];
    } else if (studentsInput && studentsInput.length) {
      throw new ApiError(400, `Role '${newRole}' cannot be linked to student records`);
    }
  }
  if (newRole !== 'teacher') {
    if (teacherInput === undefined) {
      // When role changes away from teacher, clear teacher link
      if (role !== undefined && existingUser.role === 'teacher') {
        teacherInput = null;
      }
    } else if (teacherInput) {
      throw new ApiError(400, `Role '${newRole}' cannot be linked to a teacher profile`);
    }
  }

  if (newRole === 'student' && studentsInput && studentsInput.length > 1) {
    throw new ApiError(400, 'A student account can only be linked to one student record');
  }

  if (studentsInput !== undefined) {
    const validated = await validateStudentIds(studentsInput);
    update.students = validated;
    update.student = null; // Always clear legacy field when students is explicitly set — prevents old link preservation bug
  }

  if (teacherInput !== undefined) {
    if (teacherInput === null) {
      update.teacher = null;
    } else {
      const validatedTeacher = await validateTeacherId(teacherInput);
      update.teacher = validatedTeacher;
    }
  }

  // If role is changing, ensure irrelevant links are cleared even if not explicitly provided via above logic
  if (role !== undefined) {
    if (newRole !== 'parent' && newRole !== 'student') {
      update.students = [];
      update.student = null;
    }
    if (newRole !== 'teacher') {
      update.teacher = null;
    }
  }

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).populate(['student', 'students', 'teacher']);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, message: 'User updated', data: user.toSafeJSON() });
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');
  user.password = req.body.newPassword;
  // Rotate the password version so every session the target user still holds
  // (cookie or Bearer) stops validating on its next request — a reset is
  // usually a response to a compromised/lost password, so old sessions must
  // die. Same mechanism as the self-service change in authController.js
  // (PROJECT_AUDIT.md Phase 2 / M3). Password is never logged or echoed.
  user.passwordVersion = (user.passwordVersion || 0) + 1;
  await user.save();
  res.json({ success: true, message: 'Password reset' });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  // Guard order matters: last-admin check first (covers an admin deleting
  // their own account when they are the only admin), then the self-delete
  // rule (which keeps its own clearer message whenever another admin exists).
  await assertNotLastActiveAdmin(user, 'deleted');
  if (String(req.user._id) === String(user._id)) throw new ApiError(400, 'You cannot delete your own account');
  await User.findByIdAndDelete(user._id);
  res.json({ success: true, message: 'User deleted' });
});

export const toggleUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  // Only a toggle that would DEACTIVATE an admin can cause a lockout —
  // re-activating an inactive admin is always safe and never guarded.
  if (user.isActive !== false) await assertNotLastActiveAdmin(user, 'deactivated');
  if (String(req.user._id) === String(user._id)) throw new ApiError(400, 'You cannot deactivate your own account');
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: user.toSafeJSON() });
});
