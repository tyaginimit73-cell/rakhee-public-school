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
