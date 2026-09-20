import { Student } from '../models/Student.js';
import { Teacher } from '../models/Teacher.js';
import { Notice } from '../models/Notice.js';
import { Event } from '../models/Event.js';
import { Admission } from '../models/Admission.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { queryParam } from '../validators/index.js';

// Admin global search (debounced on the client)
export const globalSearch = asyncHandler(async (req, res) => {
  // queryParam() also guards against ?q[$ne]=x style objects, which would
  // otherwise reach `.trim()` on a non-string and crash with a 500 — Phase 4A.
  const q = (queryParam(req.query.q) || '').trim();
  if (q.length < 2) return res.json({ success: true, data: { students: [], teachers: [], notices: [], events: [], admissions: [] } });
  const rx = new RegExp(escapeRegex(q), 'i');
  const [students, teachers, notices, events, admissions] = await Promise.all([
    Student.find({ $or: [{ firstName: rx }, { lastName: rx }, { rollNumber: rx }] }).populate('class', 'name section').limit(5),
    Teacher.find({ $or: [{ name: rx }, { department: rx }] }).limit(5),
    Notice.find({ title: rx }).limit(5),
    Event.find({ title: rx }).limit(5),
    Admission.find({ $or: [{ studentName: rx }, { applicationId: rx }] }).limit(5),
  ]);
  res.json({ success: true, data: { students, teachers, notices, events, admissions } });
});
