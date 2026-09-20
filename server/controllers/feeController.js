import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { Fee } from '../models/Fee.js';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paged } from '../utils/paginate.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'];

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
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid fee ID format');
  const { amount, method = 'Cash', note = '' } = req.body;
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new ApiError(400, 'Enter a valid amount');
  if (!PAYMENT_METHODS.includes(method)) throw new ApiError(400, `Invalid payment method — must be one of: ${PAYMENT_METHODS.join(', ')}`);
  if (typeof note !== 'string') throw new ApiError(400, 'Invalid payment note');

  // receiptNo: same shape as before plus 4 random hex chars — two concurrent
  // payments landing in the same millisecond must never share a receipt number.
  const receiptNo = `RCP-${Date.now().toString(36)}${crypto.randomBytes(2).toString('hex')}`.toUpperCase();
  // paymentSchema sets _id:true and date default only through the Mongoose
  // document path — a pipeline $concatArrays bypasses that, so set both here.
  const payment = { _id: new mongoose.Types.ObjectId(), amount: value, method, note, date: new Date(), receiptNo };

  // ATOMIC guarded update (PROJECT_AUDIT.md Phase 2 / M1): the balance check
  // and the increment happen inside ONE MongoDB operation, so two concurrent
  // payments can never both read the same pending balance — the second one
  // simply fails to match once the first has consumed the balance. The
  // previous read-modify-write (findById → check → push → save) raced.
  //
  // The aggregation-pipeline form also re-derives `status` from the NEW
  // paidAmount in the same operation, preserving the Fee model's pre-save
  // hook behavior (Paid / Partial / Pending) which operator-style $inc/$push
  // updates would have bypassed.
  const updated = await Fee.findOneAndUpdate(
    {
      _id: id,
      $expr: { $lte: [{ $add: [{ $ifNull: ['$paidAmount', 0] }, value] }, '$totalAmount'] },
    },
    [
      { $set: { paidAmount: { $add: [{ $ifNull: ['$paidAmount', 0] }, value] } } },
      { $set: { payments: { $concatArrays: [{ $ifNull: ['$payments', []] }, [payment]] } } },
      { $set: {
        status: { $switch: {
          branches: [
            { case: { $gte: ['$paidAmount', '$totalAmount'] }, then: 'Paid' },
            { case: { $gt: ['$paidAmount', 0] }, then: 'Partial' },
          ],
          default: 'Pending',
        } },
      } },
    ],
    { new: true },
  ).populate(populateStudent);

  if (!updated) {
    // No match = either the fee doesn't exist, or the payment would exceed the
    // remaining balance. Distinguish so the client gets the right error.
    const fee = await Fee.findById(id);
    if (!fee) throw new ApiError(404, 'Fee record not found');
    throw new ApiError(400, `Amount exceeds pending balance of ₹${fee.totalAmount - fee.paidAmount}`);
  }
  res.json({ success: true, message: `Payment of ₹${value} recorded`, data: { fee: updated, receipt: updated.payments[updated.payments.length - 1] } });
});

export const deleteFee = asyncHandler(async (req, res) => {
  const fee = await Fee.findByIdAndDelete(req.params.id);
  if (!fee) throw new ApiError(404, 'Fee record not found');
  res.json({ success: true, message: 'Fee record deleted' });
});
