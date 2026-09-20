import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  image: { type: String, default: '' },
  date: { type: Date, required: true, index: true },
  time: { type: String, default: '' },
  location: { type: String, default: 'School Campus' },
  category: { type: String, default: 'Cultural' },
  registrationRequired: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });
export const Event = mongoose.model('Event', eventSchema);
