// Loaded here (not just relied on from server.js) because this file is
// also run standalone via `npm run seed` (node config/seed.js) — a path
// that never goes through server.js at all, so nothing else would load
// server/.env into process.env before the code below reads
// MONGODB_URI/ADMIN_EMAIL/ADMIN_PASSWORD from it. Safe to import here too
// even on the normal server-boot path where server.js already loaded it
// first — dotenv doesn't override already-set values, so loading it twice
// is a no-op the second time.
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { Teacher } from '../models/Teacher.js';
import { Class } from '../models/Class.js';
import { Notice } from '../models/Notice.js';
import { Event } from '../models/Event.js';
import { GalleryImage } from '../models/GalleryImage.js';
import { Testimonial } from '../models/Testimonial.js';
import { Result } from '../models/Result.js';
import { Attendance } from '../models/Attendance.js';
import { Fee } from '../models/Fee.js';
import { Setting } from '../models/Setting.js';
import { defaultSettings } from './defaultSettings.js';

const isProd = process.env.NODE_ENV === 'production';

// Always ensured, in every environment: the CMS-driven public site reads
// this document for contact info, hero content, etc. This is baseline
// configuration, not "demo data" — a fresh production DB still needs it.
const ensureSettings = async () => {
  const exists = await Setting.findOne({ key: 'site' });
  if (!exists) await Setting.create({ key: 'site', value: defaultSettings });
};

// Always ensured, in every environment: without at least one admin
// account there is no way to log in and use the admin dashboard at all.
// In production, ADMIN_PASSWORD must be set explicitly — validateEnv()
// already refuses to boot the server without it, and this is a second,
// defense-in-depth check for the standalone `npm run seed` path, which
// bypasses that boot-time check entirely.
const ensureAdmin = async () => {
  const existing = await User.countDocuments({ role: 'admin' });
  if (existing > 0) return null;
  if (isProd && !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD must be set explicitly in production — refusing to seed a default admin password.');
  }
  if (isProd && !process.env.ADMIN_EMAIL) {
    throw new Error('ADMIN_EMAIL must be set explicitly in production — refusing to seed the well-known default admin email.');
  }
  console.log('🌱 Creating initial admin account...');
  return User.create({
    name: 'School Administrator',
    email: (process.env.ADMIN_EMAIL || 'admin@rps.school').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    role: 'admin',
  });
};

// Fake teachers/classes/students/notices/etc. Dev-mode default: on. In
// production, only runs if SEED_DEMO_DATA=true is explicitly set — a real
// school's database should start with just an admin account and site
// settings, then be populated with real data through the admin dashboard.
const seedDemoContent = async (admin) => {
  console.log('🌱 Seeding demo content...');

  // ---------- Teachers ----------
  const teachers = await Teacher.insertMany([
    { name: 'Mrs. Ananya Sharma', designation: 'Principal', qualification: 'M.Sc., B.Ed.', department: 'Administration', subjects: ['Physics'], experienceYears: 22, order: 1, bio: 'Leads the school with a vision of value-based, modern education.' },
    { name: 'Mr. Rajesh Kumar', designation: 'Vice Principal', qualification: 'M.A. (English), B.Ed.', department: 'Languages', subjects: ['English'], experienceYears: 18, order: 2 },
    { name: 'Mrs. Priya Verma', designation: 'Senior Teacher', qualification: 'M.Sc. (Maths), B.Ed.', department: 'Mathematics', subjects: ['Mathematics'], experienceYears: 14, order: 3 },
    { name: 'Mr. Amit Chaudhary', designation: 'PGT Science', qualification: 'M.Sc. (Chemistry), B.Ed.', department: 'Science', subjects: ['Chemistry', 'Biology'], experienceYears: 11, order: 4 },
    { name: 'Mrs. Sunita Rathi', designation: 'TGT Hindi', qualification: 'M.A. (Hindi), B.Ed.', department: 'Languages', subjects: ['Hindi'], experienceYears: 12, order: 5 },
    { name: 'Mr. Vikram Singh', designation: 'Sports Instructor', qualification: 'B.P.Ed., M.P.Ed.', department: 'Physical Education', subjects: ['Physical Education'], experienceYears: 9, order: 6 },
    { name: 'Ms. Neha Gupta', designation: 'Computer Teacher', qualification: 'MCA', department: 'Computer Science', subjects: ['Computer Science'], experienceYears: 7, order: 7 },
    { name: 'Mrs. Kavita Malik', designation: 'Primary Coordinator', qualification: 'B.A., NTT, B.Ed.', department: 'Social Science', subjects: ['Social Science', 'Arts'], experienceYears: 10, order: 8 },
  ]);

  // ---------- Classes ----------
  const classDefs = [
    { name: 'Nursery', section: 'A', level: 'Pre-Primary', subjects: ['English', 'Hindi', 'Mathematics', 'Arts'] },
    { name: 'UKG', section: 'A', level: 'Pre-Primary', subjects: ['English', 'Hindi', 'Mathematics', 'Arts'] },
    { name: 'Class 1', section: 'A', level: 'Primary', subjects: ['English', 'Hindi', 'Mathematics', 'EVS', 'Arts'] },
    { name: 'Class 3', section: 'A', level: 'Primary', subjects: ['English', 'Hindi', 'Mathematics', 'EVS', 'Computer Science'] },
    { name: 'Class 5', section: 'A', level: 'Primary', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science'] },
    { name: 'Class 8', section: 'A', level: 'Middle', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science'] },
    { name: 'Class 9', section: 'A', level: 'Secondary', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science'] },
    { name: 'Class 10', section: 'A', level: 'Secondary', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Physical Education'] },
  ];
  const classes = await Class.insertMany(classDefs.map((c, i) => ({ ...c, classTeacher: teachers[(i % (teachers.length - 1)) + 1]._id })));

  // ---------- Students ----------
  const first = ['Aarav', 'Diya', 'Kabir', 'Ananya', 'Vihaan', 'Myra', 'Arjun', 'Saanvi', 'Reyansh', 'Ishita', 'Krishna', 'Navya', 'Aditya', 'Pari', 'Yash', 'Riya', 'Dev', 'Aisha', 'Karan', 'Meera'];
  const last = ['Sharma', 'Verma', 'Chaudhary', 'Rathi', 'Singh', 'Malik', 'Gupta', 'Tyagi', 'Saini', 'Panwar'];
  const fathers = ['Rohit', 'Suresh', 'Manoj', 'Deepak', 'Anil', 'Rakesh', 'Sunil', 'Vinod', 'Praveen', 'Nitin'];
  const mothers = ['Pooja', 'Rekha', 'Seema', 'Anita', 'Kavita', 'Meena', 'Ritu', 'Shalini', 'Nisha', 'Preeti'];
  const students = [];
  for (let i = 0; i < 20; i += 1) {
    const cls = classes[i % classes.length];
    students.push({
      firstName: first[i], lastName: last[i % last.length],
      gender: i % 3 === 0 ? 'Female' : 'Male',
      dob: new Date(2011 + (i % 8), (i * 3) % 12, (i % 27) + 1),
      rollNumber: `RPS${String(1001 + i)}`,
      class: cls._id,
      fatherName: `${fathers[i % fathers.length]} ${last[i % last.length]}`,
      motherName: `${mothers[i % mothers.length]} ${last[i % last.length]}`,
      phone: `98765${String(43210 + i)}`,
      email: '',
      address: { line1: 'Village SohanJani Tagan', city: 'Muzaffarnagar', district: 'Muzaffarnagar', state: 'Uttar Pradesh', pincode: '251001' },
      admissionDate: new Date(2024, 3, 1),
    });
  }
  const createdStudents = await Student.insertMany(students);

  // Demo parent account linked to the first student
  await User.create({
    name: `${fathers[0]} ${last[0]}`,
    email: 'parent@demo.rps',
    password: 'Parent@12345',
    role: 'parent',
    student: createdStudents[0]._id,
    phone: `9876543210`,
  });

  // ---------- Notices ----------
  const d = (offset) => new Date(2026, 7, 19 + offset);
  await Notice.insertMany([
    { title: 'Admissions Open — New Session', description: 'Online applications are invited for admission to all classes (Nursery to Class 10). Apply through the school website or visit the school office between 9 AM and 1 PM.', category: 'Admission', isImportant: true, publishDate: d(-2) },
    { title: 'Half-Yearly Examination Date Sheet', description: 'The half-yearly examinations will commence from 15 September 2026. The detailed date sheet has been shared with all classes. Students should begin revision as per the syllabus plan.', category: 'Examination', isImportant: true, publishDate: d(-5) },
    { title: 'Parent-Teacher Meeting', description: 'A Parent-Teacher Meeting for all classes will be held on Saturday, 29 August 2026 from 9:00 AM to 12:00 PM. Parents are requested to attend without fail.', category: 'Event', publishDate: d(-8) },
    { title: 'Janmashtami Holiday', description: 'The school will remain closed on account of Janmashtami. Regular classes will resume the next working day.', category: 'Holiday', publishDate: d(-12) },
    { title: 'Science Exhibition — Call for Projects', description: 'Students of Classes 6–10 interested in the Annual Science Exhibition should submit their project ideas to their science teachers by 5 September 2026.', category: 'Academic', publishDate: d(-15) },
    { title: 'School Wins District Quiz (News)', description: 'Our senior quiz team secured first position at the District Inter-School Quiz Competition held at Muzaffarnagar. Congratulations to the team and mentors!', category: 'News', publishDate: d(-20) },
  ]);

  // ---------- Events ----------
  await Event.insertMany([
    { title: 'Annual Function 2026', description: 'A grand celebration of talent — music, dance, drama and awards. Parents are warmly invited.', date: new Date(2026, 11, 20), time: '5:00 PM onwards', location: 'School Auditorium', category: 'Cultural', image: '/images/campus/cultural.jpg', registrationRequired: true },
    { title: 'Annual Sports Day', description: 'Track and field events, march-past and house competitions across all classes.', date: new Date(2026, 10, 14), time: '9:00 AM', location: 'School Playground', category: 'Sports', image: '/images/campus/sports-action.jpg' },
    { title: 'Science Exhibition', description: 'Student projects and working models across physics, chemistry, biology and technology.', date: new Date(2026, 9, 10), time: '10:00 AM', location: 'Science Block', category: 'Academic', image: '/images/campus/lab-closeup.jpg' },
    { title: 'Independence Day Celebration', description: 'Flag hoisting, patriotic songs and cultural performances by students.', date: new Date(2026, 7, 15), time: '8:00 AM', location: 'School Ground', category: 'National', image: '/images/hero-campus.jpg' },
    { title: 'Parent-Teacher Meeting', description: 'Discuss your ward\'s progress with class teachers. Half-yearly answer sheets will be shared.', date: new Date(2026, 7, 29), time: '9:00 AM – 12:00 PM', location: 'Respective Classrooms', category: 'Meeting', image: '/images/campus/classroom.jpg' },
    { title: 'Republic Day Celebration', description: 'Parade, speeches and cultural programme celebrating the spirit of the Constitution.', date: new Date(2027, 0, 26), time: '8:30 AM', location: 'School Ground', category: 'National', image: '/images/hero-campus.jpg' },
  ]);

  // ---------- Gallery ----------
  await GalleryImage.insertMany([
    { title: 'School Campus', category: 'Campus', imagePath: '/images/hero-campus.jpg', caption: 'The academic block at golden hour' },
    { title: 'Smart Classroom', category: 'Classrooms', imagePath: '/images/campus/classroom.jpg', caption: 'Technology-enabled learning spaces', order: 1 },
    { title: 'Annual Day Celebration', category: 'Events', imagePath: '/images/campus/cultural.jpg', caption: 'Colours, music and talent on stage', order: 2 },
    { title: 'Morning Assembly', category: 'Celebrations', imagePath: '/images/campus/assembly.jpg', caption: 'Starting the day together, in discipline', order: 3 },
    { title: 'Science Laboratory', category: 'Campus', imagePath: '/images/campus/lab.jpg', caption: 'Learning by doing', order: 4 },
    { title: 'Sports Day', category: 'Sports', imagePath: '/images/campus/sports.jpg', caption: 'Annual athletics meet', order: 5 },
    { title: 'Library', category: 'Campus', imagePath: '/images/campus/library.jpg', caption: 'A quiet world of books', order: 6 },
    { title: 'Cultural Fest', category: 'Activities', imagePath: '/images/campus/cultural.jpg', caption: 'Art, dance and performance', order: 7 },
    { title: 'Classroom Activities', category: 'Classrooms', imagePath: '/images/campus/classroom.jpg', caption: 'Interactive sessions in progress', order: 8 },
    { title: 'Inter-School Quiz Winners', category: 'Achievements', imagePath: '/images/campus/assembly.jpg', caption: 'District champions, 2026', order: 9 },
    { title: 'Under the Microscope', category: 'Campus', imagePath: '/images/campus/lab-closeup.jpg', caption: 'Little scientists at work', order: 10 },
    { title: 'Race to the Finish', category: 'Sports', imagePath: '/images/campus/sports-action.jpg', caption: '100m sprint finals', order: 11 },
    { title: 'Quiet Reading Hour', category: 'Campus', imagePath: '/images/campus/reading.jpg', caption: 'Stories that take you places', order: 12 },
  ]);

  // ---------- Testimonials ----------
  await Testimonial.insertMany([
    { name: 'Rohit Sharma', role: 'Parent, Class 8', message: 'The teachers know every child personally. My son has grown more confident and disciplined since joining Rakhee Public School.', rating: 5 },
    { name: 'Seema Verma', role: 'Parent, Class 3', message: 'A safe campus, caring staff and real attention to studies. The PTM feedback is always honest and helpful.', rating: 5 },
    { name: 'Manoj Chaudhary', role: 'Parent, Class 10', message: 'Board preparation here is serious and structured. Regular tests and personal mentoring made a visible difference.', rating: 4 },
    { name: 'Anita Rathi', role: 'Alumni Parent', message: 'Both my children studied here. The school builds character along with marks — that is rare and precious.', rating: 5 },
  ]);

  // ---------- Results ----------
  const subjectSets = {
    Secondary: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science'],
    Primary: ['English', 'Hindi', 'Mathematics', 'EVS', 'Computer Science', 'Arts'],
  };
  for (const s of createdStudents) {
    const cls = classes.find((c) => String(c._id) === String(s.class));
    const set = ['Class 9', 'Class 10', 'Class 8'].includes(cls.name) ? subjectSets.Secondary : subjectSets.Primary;
    const base = 55 + Math.floor(Math.random() * 30);
    const subjects = set.map((name, i) => ({ name, maxMarks: 100, obtainedMarks: Math.min(99, base + Math.floor(Math.random() * 20) - (i % 3) * 4) }));
    await Result.create({ student: s._id, exam: 'Annual Examination', session: '2025-26', subjects });
  }

  // ---------- Attendance (school days since 1 Aug 2026) ----------
  const days = [];
  const start = new Date(2026, 7, 1);
  for (let dt = new Date(start); dt <= new Date(2026, 7, 18); dt.setDate(dt.getDate() + 1)) {
    if (dt.getDay() !== 0) days.push(dt.toISOString().slice(0, 10)); // skip Sundays
  }
  for (const cls of classes) {
    const clsStudents = createdStudents.filter((s) => String(s.class) === String(cls._id));
    if (!clsStudents.length) continue;
    for (const date of days) {
      const records = clsStudents.map((s) => {
        const r = Math.random();
        return { student: s._id, status: r < 0.9 ? 'Present' : r < 0.97 ? 'Absent' : 'Late' };
      });
      await Attendance.create({ class: cls._id, date, records, markedBy: admin._id });
    }
  }

  // ---------- Fees ----------
  for (const s of createdStudents) {
    const total = 24000 + Math.floor(Math.random() * 4) * 3000;
    const ratio = [1, 0.75, 0.5, 0.25, 0][Math.floor(Math.random() * 5)];
    const paid = Math.round((total * ratio) / 100) * 100;
    const payments = paid > 0 ? [{ amount: paid, method: ['Cash', 'UPI', 'Bank Transfer'][Math.floor(Math.random() * 3)], receiptNo: `RCP-SEED${s.rollNumber}`, date: new Date(2026, 5, 15) }] : [];
    await Fee.create({
      student: s._id, title: 'Annual Fee', session: '2026-27', totalAmount: total, paidAmount: paid,
      dueDate: new Date(2026, 9, 31), payments,
    });
  }

  console.log('✅ Demo content seeded.');
  console.log('   👨‍👩‍👧 Parent demo : parent@demo.rps / Parent@12345');
  console.log(`   🎓 Result demo : roll ${createdStudents[0].rollNumber}, DOB ${new Date(createdStudents[0].dob).toISOString().slice(0, 10)}`);
};

// Orchestrator: always ensures site settings + an admin account exist.
// Demo content (fake teachers/students/notices/etc.) seeds by default in
// dev, and ONLY if SEED_DEMO_DATA=true is explicitly set in production —
// see PROJECT_AUDIT.md for why a fresh production DB should not silently
// fill up with fake students and a well-known demo parent login.
export const seedIfEmpty = async () => {
  await ensureSettings();
  const newAdmin = await ensureAdmin();

  if (!newAdmin) return; // admin already existed — treat DB as already initialized, seed nothing further

  if (!isProd) {
    console.log(`   👤 Admin login : ${process.env.ADMIN_EMAIL || 'admin@rps.school'} / ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
  } else {
    // Never echo the admin password to production logs, even though it
    // came from the operator's own env var — logs are often aggregated
    // and shipped elsewhere.
    console.log(`   👤 Admin account created: ${process.env.ADMIN_EMAIL || 'admin@rps.school'}`);
  }

  const shouldSeedDemo = isProd ? process.env.SEED_DEMO_DATA === 'true' : process.env.SEED_DEMO_DATA !== 'false';
  if (shouldSeedDemo) {
    await seedDemoContent(newAdmin);
  } else {
    console.log('   Demo content seeding skipped. Populate real data from the admin dashboard.');
  }
};

// Standalone execution via `npm run seed` (node config/seed.js). Connects
// on its own using MONGODB_URI — a manual seed run against a throwaway
// in-memory database would be pointless, so this deliberately does NOT
// fall back to one the way the normal server boot does for local dev.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const { default: mongoose } = await import('mongoose');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('🚫 MONGODB_URI is not set. Set it in server/.env before running `npm run seed`.');
  process.exit(1);
}

try {
  console.log('🌱 Starting database seed...');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  await seedIfEmpty();

  await mongoose.disconnect();
  console.log('✅ Seed completed successfully');
  process.exit(0);
} catch (err) {
  console.error('❌ Seeding failed:', err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
}
}