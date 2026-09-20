import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const extractToken = (req) => {
  if (req.cookies?.rps_token) return req.cookies.rps_token;
  if (req.headers.authorization?.startsWith('Bearer ')) return req.headers.authorization.split(' ')[1];
  return null;
};

export const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new ApiError(401, 'Not authenticated. Please sign in.');

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).populate(['student', 'students', 'teacher']);
  if (!user || user.isActive === false) throw new ApiError(401, 'Account not found or deactivated');
  req.user = user;
  next();
});

// Identifies the requester as a logged-in user WHEN credentials are
// present and valid, but never rejects the request otherwise — for routes
// that are genuinely public but behave differently for an authenticated
// admin (e.g. GET /teachers?all=true should only bypass the public
// isActive filter for an admin, while still working with no auth at all
// for the ordinary public case). Unlike `protect`, a missing, invalid, or
// expired token here just means the request proceeds as anonymous
// (req.user stays unset) rather than a 401 — this route works fine
// without auth, so it must not require it.
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate(['student', 'students', 'teacher']);
    if (user && user.isActive !== false) req.user = user;
  } catch {
    // Invalid/expired token on an optional-auth route — proceed anonymous
    // rather than reject; only `protect`-guarded routes require a valid
    // session.
  }
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'You do not have permission to access this resource' });
  }
  next();
};
