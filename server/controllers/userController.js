import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paged } from '../utils/paginate.js';
import { escapeRegex } from '../utils/escapeRegex.js';

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
  const user = await User.create(req.body);
  res.status(201).json({ success: true, message: 'User created', data: user.toSafeJSON() });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { password, ...rest } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, message: 'User updated', data: user.toSafeJSON() });
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');
  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, message: 'Password reset' });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.params.id) throw new ApiError(400, 'You cannot delete your own account');
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, message: 'User deleted' });
});

export const toggleUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (String(req.user._id) === req.params.id) throw new ApiError(400, 'You cannot deactivate your own account');
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: user.toSafeJSON() });
});
