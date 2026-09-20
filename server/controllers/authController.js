import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';

// A syntactically valid bcrypt hash that corresponds to no real account —
// used only so a login attempt for an email that doesn't exist takes
// roughly as long as one for an email that does (with the wrong
// password). Widely known/reused in bcrypt library documentation and
// examples; using it here reveals nothing about any real user's password.
const DUMMY_HASH = '$2a$12$CwTycUXWue0Thq9StjUM0uJ8Ag/6i6IVcfDLdSQmNCbC5pE1EhEBu';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate(['student', 'students', 'teacher']);
  // Previously, a nonexistent email short-circuited via `!user` before the
  // (deliberately slow) bcrypt comparison ever ran, while a wrong password
  // for a real email always paid that cost — an attacker measuring
  // response times could use the difference to enumerate which emails
  // have accounts, even though the error message itself is already
  // identical either way. Always doing a comparison (real or dummy) closes
  // most of that gap; it's not perfectly equalized (the dummy hash's cost
  // factor may differ slightly from a given real user's), and this
  // couldn't be timed/measured in this environment (bcryptjs isn't
  // installed here — see TESTS.md), so treat this as a real but unverified
  // improvement, not a proven guarantee.
  const passwordOk = user ? await user.matchPassword(password) : await bcrypt.compare(password, DUMMY_HASH).catch(() => false);
  if (!user || !passwordOk) throw new ApiError(401, 'Invalid email or password');
  if (user.isActive === false) throw new ApiError(403, 'This account has been deactivated');
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  const token = signToken(user._id);
  setAuthCookie(res, token);
  res.json({ success: true, message: `Welcome back, ${user.name.split(' ')[0]}!`, data: { user: user.toSafeJSON(), token } });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Signed out successfully' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.toSafeJSON() });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully' });
});
