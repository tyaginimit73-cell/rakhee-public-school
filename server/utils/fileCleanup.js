import path from 'node:path';
import fs from 'node:fs';
import { publicUploadDir } from './paths.js';

// Deletes a previously-uploaded PUBLIC file (a gallery image, event image,
// or notice attachment) when a record is updated to point at a different
// file, or deleted outright. Used by galleryController, eventController,
// and noticeController — all three had the same gap: the old file was
// silently left behind forever whenever a record was updated with a new
// upload, and never cleaned up on delete either.
//
// Deliberately conservative — only actually unlinks a file when ALL of
// these hold:
//  - oldValue is genuinely a server-uploaded file path (starts with
//    "/uploads/"), never a bundled static asset like "/images/campus/..."
//    — those live in the client's public folder, not on this server at
//    all, and deleting based on that path would either silently no-op or,
//    if ever misconstructed, delete the wrong thing. Normal school photos
//    referenced this way are simply never touched by this function.
//  - it's actually being replaced or removed (oldValue !== newValue)
//  - no OTHER document in the same collection still references the exact
//    same file. This app always generates a unique filename per upload,
//    so two records sharing one uploaded file shouldn't currently happen
//    — but this checks for real rather than assuming, so a shared file
//    is never deleted out from under a record that still needs it.
export const cleanupReplacedPublicFile = async (Model, field, oldValue, newValue, excludeId) => {
  if (!oldValue || oldValue === newValue || !oldValue.startsWith('/uploads/')) return;
  const stillReferenced = await Model.exists({ [field]: oldValue, _id: { $ne: excludeId } });
  if (stillReferenced) return;
  const filename = path.basename(oldValue.replace('/uploads/', ''));
  try { fs.unlinkSync(path.join(publicUploadDir, filename)); } catch { /* already gone — fine */ }
};
