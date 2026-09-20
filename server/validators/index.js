import { z } from 'zod';

// Express middleware that validates req.body against a zod schema
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map((e) => `${e.path.join('.') || 'field'}: ${e.message}`).join('; ');
    return res.status(400).json({ success: false, message });
  }
  req.body = result.data;
  next();
};

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone').max(15),
  subject: z.string().min(2, 'Subject is required'),
  message: z.string().min(10, 'Message should be at least 10 characters'),
});

export const enquirySchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional().or(z.literal('')),
  classInterested: z.string().optional(),
  message: z.string().optional(),
});

export const resultCheckSchema = z.object({
  rollNumber: z.string().min(3, 'Roll number is required'),
  dob: z.string().min(8, 'Date of birth is required'),
});

export const trackSchema = z.object({
  applicationId: z.string().min(5, 'Application ID is required'),
  phone: z.string().min(10, 'Registered phone is required'),
});

export const admissionSchema = z.object({
  studentName: z.string().min(2, 'Student name is required'),
  dob: z.string().min(8, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  classApplyingFor: z.string().min(1, 'Class is required'),
  fatherName: z.string().min(2, "Father's name is required"),
  motherName: z.string().min(2, "Mother's name is required"),
  guardianName: z.string().optional().or(z.literal('')),
  phone: z.string().min(10, 'Enter a valid phone').max(15),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.object({
    line1: z.string().min(3, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    district: z.string().min(2, 'District is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
  }),
  previousSchool: z.string().optional().or(z.literal('')),
  previousClass: z.string().optional().or(z.literal('')),
  previousResult: z.string().optional().or(z.literal('')),
});

export const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'teacher', 'parent', 'student']),
  phone: z.string().optional().or(z.literal('')),
  student: z.string().optional().or(z.literal('')).nullable(), // legacy single-child link — new code should prefer `students` below
  students: z.array(z.string()).optional(), // parent accounts (multiple children) and student accounts (their own single record, as a one-entry array)
  teacher: z.string().optional().or(z.literal('')).nullable(), // links a teacher-role account to its Teacher profile
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Admin updating an existing user (PUT /api/users/:id). Every field is
// optional (partial updates are the existing contract — see
// controllers/userController.js, which uses key *presence* to decide
// whether a link is being set vs preserved), but NOTHING outside this
// shape survives: the validate() middleware replaces req.body with the
// parsed result, so arbitrary/mass-assigned fields are stripped before
// the controller ever sees them. Link fields accept the exact same shapes
// the controller's normalizeStudentInput/normalizeTeacherInput already
// handle — arrays, single strings, '' and null (explicit removal).
export const userUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Enter a valid email').optional(),
  role: z.enum(['admin', 'teacher', 'parent', 'student']).optional(),
  phone: z.string().optional().or(z.literal('')),
  student: z.string().optional().or(z.literal('')).nullable(), // legacy single-child link — same compat rule as userCreateSchema
  students: z.union([z.array(z.string()), z.string()]).nullable().optional(), // set (array/single) or clear (null/'')
  teacher: z.string().optional().or(z.literal('')).nullable(),
});

// Admin resetting another user's password (PATCH /api/users/:id/password).
// Same minimum strength as user creation and self-service change-password —
// previously this path only enforced the model's 6-character minimum.
export const userResetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// ---------------------------------------------------------------------------
// Website settings (PUT /api/settings). Mirrors the REAL structure of
// server/config/defaultSettings.js one-for-one — no invented fields, no
// removed fields. Every field is optional because the endpoint is a
// deep-merging partial update (controllers/settingsController.js): sending
// only { site: { phone } } must keep working exactly as before.
//
// Unknown keys — including '__proto__', 'constructor' and 'prototype' — are
// STRIPPED rather than rejected. Rationale: zod's default strip behavior is
// the strictest option that cannot break the existing admin Settings page
// (which always PUTs the full merged document it received from GET), while a
// hard reject would fail the whole save if a legacy settings document ever
// carried an extra key. settingsController.js additionally skips dangerous
// keys inside deepMerge() as defense in depth.
// ---------------------------------------------------------------------------
const settingsSiteSchema = z.object({
  schoolName: z.string().optional(),
  tagline: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  establishedYear: z.string().optional(),
  affiliation: z.string().optional(),
  board: z.string().optional(),
  hours: z.string().optional(),
});

const settingsHeroSchema = z.object({
  headline: z.string().optional(),
  subtext: z.string().optional(),
  image: z.string().optional(),
});

const settingsStatSchema = z.object({
  label: z.string().optional(),
  value: z.number().optional(), // homepage counters are numeric (useCountUp)
  suffix: z.string().optional(),
});

const settingsAboutSchema = z.object({
  intro: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  values: z.array(z.string()).optional(),
});

const settingsPrincipalSchema = z.object({
  name: z.string().optional(),
  designation: z.string().optional(),
  photo: z.string().optional(),
  message: z.string().optional(),
});

const settingsSocialSchema = z.object({
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  youtube: z.string().optional(),
});

const settingsFacilityItemSchema = z.object({
  label: z.string().optional(),
  available: z.boolean().optional(),
});

const settingsFacilityGroupSchema = z.object({
  group: z.string().optional(),
  items: z.array(settingsFacilityItemSchema).optional(),
});

export const settingsUpdateSchema = z.object({
  site: settingsSiteSchema.optional(),
  announcement: z.string().optional(),
  admissionOpen: z.boolean().optional(),
  hero: settingsHeroSchema.optional(),
  stats: z.array(settingsStatSchema).optional(),
  about: settingsAboutSchema.optional(),
  principal: settingsPrincipalSchema.optional(),
  social: settingsSocialSchema.optional(),
  facilities: z.array(settingsFacilityGroupSchema).optional(),
  feesNote: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Phase 4A — admin CRUD request schemas + query-filter hardening.
//
// Conventions (same as the Phase 1/2 schemas above):
//  - validate() REPLACES req.body with the parsed result, so anything not in
//    the schema is stripped before the controller sees it (no mass
//    assignment). The admin frontend's edit flows spread the fetched document
//    into the PUT payload (bringing _id/createdAt/updatedAt/__v along), so
//    stripping — not rejecting — unknown keys is what keeps those flows
//    working while still blocking arbitrary fields.
//  - Multipart forms (notices/events/gallery) send EVERY value as a string,
//    so booleans accept the literal 'true'/'false' strings and numbers accept
//    numeric strings; the existing controller coercions keep working.
//  - Schemas validate the fields the current models/controllers actually
//    support. No new business rules are invented; the only deliberate
//    tightenings are the ones the Phase 4 audit called out: fee totalAmount
//    must be finite and strictly positive, gallery order must be a real
//    integer (never silently coerced to 0), and dates must parse.
// ---------------------------------------------------------------------------

// Shared building blocks ------------------------------------------------

// 24-hex-char MongoDB ObjectId as it appears in request bodies/params.
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format');

// A date in any format Date.parse accepts (the frontend sends YYYY-MM-DD
// from <input type="date"> / toInputDate). Rejects empty/garbage strings.
// Extra check for plain YYYY-MM-DD: Date.parse silently ROLLS OVER
// impossible calendar days (2026-02-30 -> March 2), so ISO dates must also
// round-trip — that's what catches Feb 30, month 13, day 32, etc.
const isValidDateInput = (v) => {
  if (Number.isNaN(Date.parse(v))) return false;
  const iso = String(v).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(v).toISOString().slice(0, 10) === `${iso[1]}-${iso[2]}-${iso[3]}`;
  return true;
};
const dateStr = z
  .string()
  .refine(isValidDateInput, 'must be a valid date');

// Optional date that treats '' as "not provided" — the frontend clears date
// inputs to '' and today Mongoose casts '' to null for Date paths; this
// preserves that exact behavior instead of turning it into a 400.
const optionalDateStr = z.preprocess((v) => (v === '' ? undefined : v), dateStr.optional());

// Booleans that also accept the multipart string forms 'true'/'false'.
const flexBool = z.union([z.boolean(), z.enum(['true', 'false'])]);

// Finite number that also accepts numeric strings ('5000' from text/number
// inputs). Rejects NaN/Infinity and anything non-numeric.
const toNumber = (v) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : v);
const flexFinite = z.preprocess(toNumber, z.number().finite('must be a valid number'));
const flexPositive = z.preprocess(toNumber, z.number().finite('must be a valid number').positive('must be greater than 0'));
const flexInt = z.preprocess(toNumber, z.number().finite('must be a valid number').int('must be a whole number'));
const flexNonNegativeInt = z.preprocess(toNumber, z.number().finite('must be a valid number').int('must be a whole number').min(0, 'cannot be negative'));

// '' is treated as "not provided" for optional reference fields — matches
// the frontend selects (empty option) and Mongoose's '' -> null ObjectId
// cast, while still rejecting malformed-but-non-empty ids.
const optionalObjectId = z.preprocess(
  (v) => (v === '' ? null : v),
  z.union([objectId, z.null()]).optional(),
);

const addressSchema = z.object({
  line1: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
});

const stringList = z.array(z.string().max(100)).max(30);

// Students --------------------------------------------------------------

const studentBaseShape = {
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().max(100),
  gender: z.enum(['Male', 'Female', 'Other']),
  dob: dateStr,
  rollNumber: z.string().trim().min(1, 'Roll number is required').max(50),
  class: objectId, // Class reference — format-checked here, existence handled by the model
  admissionDate: dateStr,
  fatherName: z.string().trim().min(1, "Father's name is required").max(100),
  motherName: z.string().trim().min(1, "Mother's name is required").max(100),
  phone: z.string().trim().min(6, 'Enter a valid phone number').max(15),
  email: z.string().email('Enter a valid email').max(254).or(z.literal('')),
  address: addressSchema,
  bloodGroup: z.string().max(10),
  status: z.enum(['active', 'alumni', 'inactive']),
};

export const studentCreateSchema = z.object({
  firstName: studentBaseShape.firstName,
  lastName: studentBaseShape.lastName.optional(),
  gender: studentBaseShape.gender,
  dob: studentBaseShape.dob,
  rollNumber: studentBaseShape.rollNumber,
  class: studentBaseShape.class,
  admissionDate: studentBaseShape.admissionDate.optional(),
  fatherName: studentBaseShape.fatherName,
  motherName: studentBaseShape.motherName,
  phone: studentBaseShape.phone,
  email: studentBaseShape.email.optional(),
  address: studentBaseShape.address.optional(),
  bloodGroup: studentBaseShape.bloodGroup.optional(),
  status: studentBaseShape.status.optional(),
});

// Partial update — every field optional. The Phase 1 teacher write-whitelist
// in studentController.js still runs AFTER this middleware, so teachers keep
// being rejected (not silently stripped) for any field outside their list.
export const studentUpdateSchema = z
  .object(studentBaseShape)
  .partial();

// Teachers --------------------------------------------------------------

const teacherBaseShape = {
  name: z.string().trim().min(2, 'Name is required').max(100),
  photo: z.string().max(500),
  designation: z.string().trim().min(1, 'Designation is required').max(100),
  qualification: z.string().trim().min(1, 'Qualification is required').max(200),
  department: z.string().trim().min(1, 'Department is required').max(100),
  subjects: stringList,
  experienceYears: flexNonNegativeInt,
  email: z.string().email('Enter a valid email').max(254).or(z.literal('')),
  phone: z.string().trim().max(15).or(z.literal('')),
  bio: z.string().max(2000).or(z.literal('')),
  order: flexInt,
  isActive: z.boolean(),
};

export const teacherCreateSchema = z.object({
  name: teacherBaseShape.name,
  photo: teacherBaseShape.photo.optional(),
  designation: teacherBaseShape.designation,
  qualification: teacherBaseShape.qualification,
  department: teacherBaseShape.department,
  subjects: teacherBaseShape.subjects.optional(),
  experienceYears: teacherBaseShape.experienceYears.optional(),
  email: teacherBaseShape.email.optional(),
  phone: teacherBaseShape.phone.optional(),
  bio: teacherBaseShape.bio.optional(),
  order: teacherBaseShape.order.optional(),
  isActive: teacherBaseShape.isActive.optional(),
});

export const teacherUpdateSchema = z
  .object(teacherBaseShape)
  .partial();

// Classes ---------------------------------------------------------------

const classBaseShape = {
  name: z.string().trim().min(1, 'Class name is required').max(100),
  section: z.string().trim().min(1, 'Section is required').max(20),
  level: z.enum(['Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Senior Secondary']),
  classTeacher: optionalObjectId, // existence of the Teacher is checked in classController
  subjects: stringList,
  capacity: flexNonNegativeInt,
};

export const classCreateSchema = z.object({
  name: classBaseShape.name,
  section: classBaseShape.section,
  level: classBaseShape.level.optional(),
  classTeacher: classBaseShape.classTeacher,
  subjects: classBaseShape.subjects.optional(),
  capacity: classBaseShape.capacity.optional(),
});

export const classUpdateSchema = z
  .object(classBaseShape)
  .partial();

// Fees ------------------------------------------------------------------

export const feeCreateSchema = z.object({
  rollNumber: z.string().trim().min(1, 'Roll number is required').max(50),
  title: z.string().trim().min(1, 'Fee title is required').max(200),
  session: z.string().trim().max(50).optional(),
  // Finite AND strictly positive: rejects NaN/Infinity, malformed strings,
  // zero (a zero-total fee would instantly read as "Paid") and negatives.
  totalAmount: flexPositive,
  dueDate: optionalDateStr,
  note: z.string().max(1000).optional(),
});

// Notices ---------------------------------------------------------------

const noticeBaseShape = {
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().min(1, 'Description is required').max(20000),
  category: z.enum(['Academic', 'Examination', 'Admission', 'Holiday', 'General', 'Event', 'News']),
  isImportant: flexBool,
  isPublished: flexBool,
  publishDate: dateStr,
};

export const noticeCreateSchema = z.object({
  title: noticeBaseShape.title,
  description: noticeBaseShape.description,
  category: noticeBaseShape.category.optional(),
  isImportant: noticeBaseShape.isImportant.optional(),
  isPublished: noticeBaseShape.isPublished.optional(),
  publishDate: noticeBaseShape.publishDate.optional(),
});

export const noticeUpdateSchema = z
  .object(noticeBaseShape)
  .partial();

// Events ----------------------------------------------------------------

const eventBaseShape = {
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().min(1, 'Description is required').max(20000),
  date: dateStr,
  time: z.string().max(100),
  location: z.string().max(200),
  category: z.string().max(100),
  registrationRequired: flexBool,
  isPublished: flexBool,
};

export const eventCreateSchema = z.object({
  title: eventBaseShape.title,
  description: eventBaseShape.description,
  date: eventBaseShape.date,
  time: eventBaseShape.time.optional(),
  location: eventBaseShape.location.optional(),
  category: eventBaseShape.category.optional(),
  registrationRequired: eventBaseShape.registrationRequired.optional(),
  isPublished: eventBaseShape.isPublished.optional(),
});

export const eventUpdateSchema = z
  .object(eventBaseShape)
  .partial();

// Gallery ---------------------------------------------------------------

// order: ''/absent stays "no opinion" (controller defaults it to 0, same as
// before), but a present non-numeric value is now REJECTED instead of being
// silently coerced to 0.
const galleryOrder = z.preprocess(
  (v) => (v === '' ? undefined : toNumber(v)),
  z.number().finite('Order must be a valid number').int('Order must be a whole number').optional(),
);

export const galleryCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  caption: z.string().max(500).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  imagePath: z.string().max(500).optional(), // used only when no image file is uploaded
  order: galleryOrder.optional(),
});

export const galleryUpdateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300).optional(),
  caption: z.string().max(500).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  order: galleryOrder.optional(),
});

// Testimonials ----------------------------------------------------------

const testimonialBaseShape = {
  name: z.string().trim().min(2, 'Name is required').max(100),
  role: z.string().max(100),
  message: z.string().trim().min(5, 'Message is required').max(5000),
  rating: z.preprocess(toNumber, z.number().finite('Rating must be a valid number').int('Rating must be a whole number').min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5')),
  isPublished: flexBool,
};

export const testimonialCreateSchema = z.object({
  name: testimonialBaseShape.name,
  role: testimonialBaseShape.role.optional(),
  message: testimonialBaseShape.message,
  rating: testimonialBaseShape.rating.optional(),
  isPublished: testimonialBaseShape.isPublished.optional(),
});

export const testimonialUpdateSchema = z
  .object(testimonialBaseShape)
  .partial();

// ---------------------------------------------------------------------------
// Query-filter hardening (Phase 4 audit / L7): Express's default *extended*
// query parser turns operator-style parameters like ?status[$ne]=x into
// OBJECTS ({ '$ne': 'x' }), which — dropped straight into a Mongo filter —
// become query operators. Every list endpoint that copies a query value into
// a filter now passes it through queryParam() first: plain strings pass
// through unchanged (existing behavior preserved exactly), while objects,
// arrays and other non-string shapes are treated as if the parameter was
// never sent. The fixed authorization predicates next to these filters
// (isPublished, isActive, teacher class scope, admin-only routes) are
// untouched.
// ---------------------------------------------------------------------------
export const queryParam = (value) => (typeof value === 'string' ? value : undefined);
