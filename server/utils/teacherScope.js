import { Class } from '../models/Class.js';
import { Student } from '../models/Student.js';

// "Assigned classes" is deliberately defined as exactly what the existing
// data model already tracks — Class.classTeacher — rather than inventing
// a new TeacherClassAssignment collection. Nothing stops multiple classes
// sharing one classTeacher, so this already supports one teacher being
// responsible for several classes with no schema change at all. See
// PROJECT_AUDIT.md for why this was chosen over a new collection.
export const getAssignedClassIds = async (teacherId) => {
  // Every real caller passes req.user.teacher, which — since
  // middleware/auth.js now populates it — is a full Teacher document, not
  // a bare id. Extracting _id explicitly here rather than trusting
  // Mongoose to cast a populated document correctly when it's used as a
  // query filter value: that behavior isn't something to rely on for
  // something this security-critical, and getting it wrong would fail
  // silently (an empty result, not an error) rather than loudly.
  const id = teacherId?._id || teacherId;
  if (!id) return [];
  const classes = await Class.find({ classTeacher: id }).select('_id');
  return classes.map((c) => String(c._id));
};

export const isClassAssignedToTeacher = async (teacherId, classId) => {
  if (!teacherId || !classId) return false;
  const assigned = await getAssignedClassIds(teacherId);
  return assigned.includes(String(classId));
};

// A student "belongs" to a teacher if the student's own class is one of
// that teacher's assigned classes. Used to gate any per-student teacher
// action (viewing one student's detail, marking their attendance) so a
// teacher can't reach a student outside their own classes by supplying an
// arbitrary studentId, even though the class-level check alone would stop
// most cases.
export const isStudentAssignedToTeacher = async (teacherId, studentId) => {
  if (!teacherId || !studentId) return false;
  const student = await Student.findById(studentId).select('class');
  if (!student) return false;
  return isClassAssignedToTeacher(teacherId, student.class);
};
