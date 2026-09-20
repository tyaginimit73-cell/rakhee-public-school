import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 1 },
  date: { type: Date, default: Date.now },
  method: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'], default: 'Cash' },
  receiptNo: { type: String, required: true },
  note: { type: String, default: '' },
}, { _id: true });

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  title: { type: String, required: true },         // e.g. "Annual Fee 2026-27"
  session: { type: String, default: '2026-27' },
  totalAmount: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  dueDate: { type: Date },
  payments: [paymentSchema],
  status: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending', index: true },
  note: { type: String, default: '' },
}, { timestamps: true });

feeSchema.virtual('pendingAmount').get(function () { return Math.max(0, this.totalAmount - this.paidAmount); });
feeSchema.set('toJSON', { virtuals: true });
feeSchema.set('toObject', { virtuals: true });
feeSchema.pre('save', function (next) {
  this.status = this.paidAmount >= this.totalAmount ? 'Paid' : this.paidAmount > 0 ? 'Partial' : 'Pending';
  next();
});
export const Fee = mongoose.model('Fee', feeSchema);
