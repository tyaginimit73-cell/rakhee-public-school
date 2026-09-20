import mongoose from 'mongoose';
import { Class } from '../models/Class.js';
import { Student } from '../models/Student.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getAssignedClassIds = async (teacherId) => {
  const id = teacherId?._id || teacherId;
  if (!id) return [];
  if (!isValidObjectId(id)) return [];
  const classes = await Class.find({ classTeacher: id }).select('_id');
  return classes.map((c) => String(c._id));
};

export const isClassAssignedToTeacher = async (teacherId, classId) => {
  if (!teacherId || !classId) return false;
  if (!isValidObjectId(classId)) return false;
  const assigned = await getAssignedClassIds(teacherId);
  return assigned.includes(String(classId));
};

export const isStudentAssignedToTeacher = async (teacherId, studentId) => {
  if (!teacherId || !studentId) return false;
  if (!isValidObjectId(studentId)) return false;
  let student;
  try {
    student = await Student.findById(studentId).select('class');
  } catch {
    return false;
  }
  if (!student) return false;
  return isClassAssignedToTeacher(teacherId, student.class);
};
