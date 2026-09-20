import mongoose from 'mongoose';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getLinkedStudentIds, hasLinkedStudent } from '../utils/linkedStudents.js';
import { getStudentOverview, getSharedPortalContent } from '../utils/studentOverview.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Enough detail for a child-selector UI (name, class, roll number) — not
// the full per-child overview, which is a separate, heavier call so
// switching children doesn't mean re-fetching everyone's attendance/fees
// up front.
export const listMyChildren = asyncHandler(async (req, res) => {
  const ids = getLinkedStudentIds(req.user);
  const children = ids.length
    ? await Student.find({ _id: { $in: ids } }).populate('class', 'name section').select('firstName lastName rollNumber class gender dob')
    : [];
  res.json({ success: true, data: { children } });
});

// Full overview for ONE of this parent's children. studentId is a URL
// param, but it is only ever honored if it's genuinely one of THIS
// parent's own linked children (checked against the server-derived list
// from the authenticated session, never against anything the client
// asserts) — this is what stops a parent from reading another family's
// child by editing the id in the request.
export const getChildOverview = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (!isValidObjectId(studentId)) {
    throw new ApiError(400, 'Invalid student ID format');
  }
  if (!hasLinkedStudent(req.user, studentId)) {
    throw new ApiError(403, 'This student is not linked to your account');
  }
  const [overview, shared] = await Promise.all([getStudentOverview(studentId), getSharedPortalContent()]);
  res.json({ success: true, data: { ...shared, ...overview } });
});
