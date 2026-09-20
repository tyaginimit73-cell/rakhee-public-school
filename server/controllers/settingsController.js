import { Setting } from '../models/Setting.js';
import { defaultSettings } from '../config/defaultSettings.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

// Keys that must never be merged into the settings document, even if some
// future code path hands deepMerge() unvalidated input (the PUT route itself
// already strips everything unknown via settingsUpdateSchema — zod parsing
// runs before this ever sees req.body — so this is defense in depth, and it
// also protects the GET path, which merges whatever is already stored).
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const deepMerge = (target, source) => {
  const out = { ...target };
  for (const k of Object.keys(source || {})) {
    if (DANGEROUS_KEYS.has(k)) continue;
    out[k] = isObject(source[k]) && isObject(target?.[k]) ? deepMerge(target[k], source[k]) : source[k];
  }
  return out;
};

export const getSettings = asyncHandler(async (req, res) => {
  const doc = await Setting.findOne({ key: 'site' });
  res.json({ success: true, data: deepMerge(defaultSettings, doc?.value || {}) });
});

export const updateSettings = asyncHandler(async (req, res) => {
  // req.body here is the PARSED output of settingsUpdateSchema (applied in
  // routes/settingRoutes.js): correctly typed, matching the real settings
  // structure, with every unknown/dangerous key already stripped. Partial
  // updates still work — the schema makes every field optional and
  // deepMerge() only overwrites what was actually sent.
  const doc = await Setting.findOne({ key: 'site' });
  const merged = deepMerge(doc?.value || {}, req.body);
  const saved = await Setting.findOneAndUpdate({ key: 'site' }, { value: merged }, { upsert: true, new: true });
  res.json({ success: true, message: 'Website settings saved', data: deepMerge(defaultSettings, saved.value) });
});
