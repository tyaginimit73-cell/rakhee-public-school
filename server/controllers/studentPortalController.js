import { asyncHandler } from '../utils/asyncHandler.js';
import { getLinkedStudentIds } from '../utils/linkedStudents.js';
import { getStudentOverview, getSharedPortalContent } from '../utils/studentOverview.js';

// A student account has exactly one linked student record: itself. There
// is deliberately no studentId anywhere in this route (see
// routes/studentPortalRoutes.js) — the id is derived purely from the
// authenticated session via getLinkedStudentIds(req.user), so there is no
// id in the request for a student to tamper with in the first place to
// reach someone else's data. This is stronger than an ownership check on
// a supplied id; there's nothing to check because nothing is supplied.
export const getMyOverview = asyncHandler(async (req, res) => {
  const [studentId] = getLinkedStudentIds(req.user);
  const shared = await getSharedPortalContent();
  if (!studentId) {
    return res.json({ success: true, data: { ...shared, student: null, message: 'No student profile linked to this account yet. Please contact the school office.' } });
  }
  const overview = await getStudentOverview(studentId);
  res.json({ success: true, data: { ...shared, ...overview } });
});
