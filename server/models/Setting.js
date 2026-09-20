import mongoose from 'mongoose';

// Single flexible document (key: 'site') powering the whole CMS
const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'site' },
  value: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
export const Setting = mongoose.model('Setting', settingSchema);
