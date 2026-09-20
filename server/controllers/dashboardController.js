import { Student } from '../models/Student.js';
import { Teacher } from '../models/Teacher.js';
import { Admission } from '../models/Admission.js';
import { Attendance } from '../models/Attendance.js';
import { Fee } from '../models/Fee.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { Enquiry } from '../models/Enquiry.js';
import { Class } from '../models/Class.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const monthKey = (d) => d.toISOString().slice(0, 7);

export const overview = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const [students, teachers, pendingApps, newApps, unreadMessages, newEnquiries, attendanceDocs, feeAgg] = await Promise.all([
    Student.countDocuments({ status: 'active' }),
    Teacher.countDocuments({ isActive: true }),
    Admission.countDocuments({ status: { $in: ['Submitted', 'Under Review'] } }),
    Admission.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 864e5) } }),
    ContactMessage.countDocuments({ isRead: false }),
    Enquiry.countDocuments({ status: 'New' }),
    Attendance.find({ date: today }).select('records'),
    Fee.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' }, paid: { $sum: '$paidAmount' } } }]),
  ]);

  let present = 0, marked = 0;
  attendanceDocs.forEach((d) => d.records.forEach((r) => { marked += 1; if (r.status !== 'Absent') present += 1; }));

  // Admission trend — last 6 months
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); sixMonthsAgo.setDate(1);
  const admAgg = await Admission.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
  ]);
  const admMap = Object.fromEntries(admAgg.map((a) => [a._id, a.count]));
  const admissionTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const key = monthKey(d);
    return { month: d.toLocaleString('en', { month: 'short' }), applications: admMap[key] || 0 };
  });

  // Attendance trend — last 7 marked days
  const recentAttendance = await Attendance.find().sort('-date').limit(60).select('date records');
  const byDay = {};
  recentAttendance.forEach((d) => {
    byDay[d.date] = byDay[d.date] || { date: d.date, present: 0, total: 0 };
    d.records.forEach((r) => { byDay[d.date].total += 1; if (r.status !== 'Absent') byDay[d.date].present += 1; });
  });
  const attendanceTrend = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)).slice(-7)
    .map((d) => ({ day: new Date(d.date).toLocaleDateString('en', { day: 'numeric', month: 'short' }), percentage: d.total ? Math.round((d.present / d.total) * 100) : 0 }));

  // Students per class
  const classes = await Class.find().sort('name');
  const counts = await Student.aggregate([{ $match: { status: 'active' } }, { $group: { _id: '$class', count: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  const classDistribution = classes.map((c) => ({ name: `${c.name} ${c.section}`, students: countMap[String(c._id)] || 0 })).filter((c) => c.students > 0);

  const totals = feeAgg[0] || { total: 0, paid: 0 };
  const feeCollection = [
    { name: 'Collected', value: totals.paid },
    { name: 'Pending', value: Math.max(0, totals.total - totals.paid) },
  ];

  const recentAdmissions = await Admission.find().sort('-createdAt').limit(5);
  const latestMessages = await ContactMessage.find().sort('-createdAt').limit(5);

  res.json({
    success: true,
    data: {
      stats: { students, teachers, pendingApps, newApps, unreadMessages, newEnquiries,
        attendanceToday: { present, marked }, pendingFees: Math.max(0, totals.total - totals.paid), totalFees: totals.total, collectedFees: totals.paid },
      admissionTrend, attendanceTrend, classDistribution, feeCollection, recentAdmissions, latestMessages,
    },
  });
});
