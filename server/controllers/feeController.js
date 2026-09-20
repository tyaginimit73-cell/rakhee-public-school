import { Fee } from '../models/Fee.js';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paged } from '../utils/paginate.js';

const populateStudent = { path: 'student', select: 'firstName lastName rollNumber class', populate: { path: 'class', select: 'name section' } };

export const listFees = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const data = await paged(Fee.find(filter).populate(populateStudent).sort('-createdAt'), req, Fee.countDocuments(filter));
  res.json({ success: true, data });
});

export const createFee = asyncHandler(async (req, res) => {
  const { rollNumber, title, session, totalAmount, dueDate, note } = req.body;
  const student = await Student.findOne({ rollNumber: (rollNumber || '').trim().toUpperCase() });
  if (!student) throw new ApiError(404, `No student found with roll number ${rollNumber}`);
  const fee = await Fee.create({ student: student._id, title, session, totalAmount: Number(totalAmount), dueDate, note });
  res.status(201).json({ success: true, message: 'Fee record created', data: fee });
});

export const addPayment = asyncHandler(async (req, res) => {
  const { amount, method = 'Cash', note = '' } = req.body;
  const fee = await Fee.findById(req.params.id).populate(populateStudent);
  if (!fee) throw new ApiError(404, 'Fee record not found');
  const value = Number(amount);
  if (!value || value <= 0) throw new ApiError(400, 'Enter a valid amount');
  if (value > fee.totalAmount - fee.paidAmount) throw new ApiError(400, `Amount exceeds pending balance of ₹${fee.totalAmount - fee.paidAmount}`);
  const receiptNo = `RCP-${Date.now().toString(36).toUpperCase()}`;
  fee.payments.push({ amount: value, method, note, receiptNo });
  fee.paidAmount += value;
  await fee.save();
  res.json({ success: true, message: `Payment of ₹${value} recorded`, data: { fee, receipt: fee.payments[fee.payments.length - 1] } });
});

export const deleteFee = asyncHandler(async (req, res) => {
  const fee = await Fee.findByIdAndDelete(req.params.id);
  if (!fee) throw new ApiError(404, 'Fee record not found');
  res.json({ success: true, message: 'Fee record deleted' });
});
