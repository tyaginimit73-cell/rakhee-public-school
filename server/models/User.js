import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'teacher', 'parent', 'student'], default: 'parent', index: true },
  phone: { type: String, trim: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, // LEGACY single-child link — kept exactly as-is for backward compatibility with existing parent accounts. New code should read via utils/linkedStudents.js, not this field directly. Never removed, never bulk-migrated.
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }], // current multi-child link for parent accounts, and the single-entry link for student accounts going forward. See utils/linkedStudents.js for how this and the legacy `student` field above are reconciled.
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }, // links a teacher-role account to their Teacher profile record
  // Bumped on every password rotation (self change or admin reset). Every JWT
  // carries the version it was issued with (`pv` claim — see utils/token.js);
  // middleware/auth.js rejects tokens whose version is older than this value,
  // which invalidates ALL pre-existing sessions the moment a password turns
  // over. Absent on documents created before this field existed — all readers
  // treat "absent" as 0, so existing users keep their sessions until their
  // password next rotates (no forced mass logout). PROJECT_AUDIT.md Phase 2 / M3.
  passwordVersion: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};
userSchema.methods.toSafeJSON = function () {
  const o = this.toObject();
  delete o.password;
  // Internal session-invalidation counter — never useful to any client.
  delete o.passwordVersion;
  // Resolved once, here, so every consumer (frontend included) reads one
  // field and never needs to know the legacy `student` / new `students`
  // split exists at all. Populated with full student objects when the
  // document was loaded with .populate(['student','students']) first
  // (true for every auth-flow read — see middleware/auth.js,
  // authController.js); falls back to bare ids otherwise, same as
  // getLinkedStudentIds in utils/linkedStudents.js, which this
  // deliberately mirrors (kept as a sync, no-extra-query version of the
  // same rule since toSafeJSON can't be async).
  o.effectiveStudents = o.students?.length ? o.students : (o.student ? [o.student] : []);
  return o;
};
export const User = mongoose.model('User', userSchema);
