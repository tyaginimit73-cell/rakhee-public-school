import mongoose from 'mongoose';

// Generic atomic counter, keyed by name (e.g. "admissionApplicationId").
// MongoDB's findOneAndUpdate with $inc is atomic at the document level, so
// concurrent requests can never read-then-write the same value — unlike a
// naive `countDocuments() + 1`, which races under concurrent submissions.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.model('Counter', counterSchema);

// Returns the next number in the named sequence, creating it at 0 → 1 if
// this is the first call. Safe to call concurrently from many requests.
export const nextSequence = async (name) => {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return doc.seq;
};
