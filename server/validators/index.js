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
