import { Setting } from '../models/Setting.js';
import { defaultSettings } from '../config/defaultSettings.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
const deepMerge = (target, source) => {
  const out = { ...target };
  for (const k of Object.keys(source || {})) {
    out[k] = isObject(source[k]) && isObject(target?.[k]) ? deepMerge(target[k], source[k]) : source[k];
  }
  return out;
};

export const getSettings = asyncHandler(async (req, res) => {
  const doc = await Setting.findOne({ key: 'site' });
  res.json({ success: true, data: deepMerge(defaultSettings, doc?.value || {}) });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const doc = await Setting.findOne({ key: 'site' });
  const merged = deepMerge(doc?.value || {}, req.body);
  const saved = await Setting.findOneAndUpdate({ key: 'site' }, { value: merged }, { upsert: true, new: true });
  res.json({ success: true, message: 'Website settings saved', data: deepMerge(defaultSettings, saved.value) });
});
