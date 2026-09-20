import { Student } from '../models/Student.js';
import { Result } from '../models/Result.js';
import { Fee } from '../models/Fee.js';
import { Notice } from '../models/Notice.js';
import { Event } from '../models/Event.js';
import { Document } from '../models/Document.js';
import { Attendance } from '../models/Attendance.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Legacy generic portal overview — kept for backward compatibility but now
// secured to use the same linked-student resolution as the new role-specific
// portals and restricted to parent/student roles only (see routes/portalRoutes.js).
// Previously used only user.student (legacy single field) and had no role check,
// so a teacher could hit it and a parent with multiple children would only see
// the legacy link. Now uses getLinkedStudentIds and returns the first linked
// student for backward compat, while the new /parent and /student routes remain
// the preferred architecture.
import { getLinkedStudentIds } from '../utils/linkedStudents.js';
import { getStudentOverview, getSharedPortalContent } from '../utils/studentOverview.js';

export const portalOverview = asyncHandler(async (req, res) => {
  const shared = await getSharedPortalContent();
  const linkedIds = getLinkedStudentIds(req.user);

  if (!linkedIds.length) {
    return res.json({
      success: true,
      data: {
        ...shared,
        student: null,
        message: 'No student profile linked to this account yet. Please contact the school office.',
      },
    });
  }

  // For backward compatibility, return overview for the first linked student.
  // Multi-child parents should use /api/parent/children/:studentId.
  const [firstId] = linkedIds;
  try {
    const overview = await getStudentOverview(firstId);
    res.json({ success: true, data: { ...shared, ...overview } });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.json({
        success: true,
        data: {
          ...shared,
          student: null,
          message: 'Linked student record not found. Please contact the school office.',
        },
      });
    }
    throw err;
  }
});
