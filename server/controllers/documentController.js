import path from 'node:path';
import fs from 'node:fs';
import { Document } from '../models/Document.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { privateUploadDir } from '../utils/paths.js';

export const listDocuments = asyncHandler(async (req, res) => {
  const filter = req.user?.role === 'admin' ? {} : { visibility: 'public' };
  // filePath is now an internal storage reference, not a fetchable URL —
  // the frontend downloads via GET /api/documents/:id/download instead
  // (see downloadDocument below). Excluded here so the API response never
  // hints at a real filesystem filename.
  const items = await Document.find(filter).select('-filePath').sort('-createdAt');
  res.json({ success: true, data: { items } });
});

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'A file is required');
  const doc = await Document.create({
    title: req.body.title || req.file.originalname,
    category: req.body.category || 'General',
    visibility: req.body.visibility || 'admin',
    filePath: req.file.filename, // bare filename in the private directory — never a public URL
    originalName: req.file.originalname,
    size: req.file.size,
    uploadedBy: req.user._id,
  });
  const { filePath, ...safeDoc } = doc.toObject();
  res.status(201).json({ success: true, message: 'Document uploaded', data: safeDoc });
});

// Authenticated, authorization-checked download — this is now the ONLY
// way to actually retrieve a Document's file content. Requires being
// signed in at all (protect, in documentRoutes.js), then separately
// checks per-document visibility below: 'public' documents are
// downloadable by any signed-in role (matching listDocuments' own
// filter), 'admin' documents only by an admin. The file itself lives
// outside any statically-served directory (see utils/paths.js), so there
// is no way to reach it except through this check.
export const downloadDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Document not found');
  if (doc.visibility !== 'public' && req.user.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to access this document');
  }
  // doc.filePath is a bare filename this server generated at upload time
  // (see uploadDocument above) — never client input at download time — but
  // it's re-validated with path.basename anyway as defense in depth, so a
  // stray "../" could never end up in the path we actually open even if a
  // future code path ever let filePath be set some other way.
  const safeName = path.basename(doc.filePath);
  const filePath = path.join(privateUploadDir, safeName);
  if (!fs.existsSync(filePath)) throw new ApiError(404, 'File not found on server');
  res.download(filePath, doc.originalName || safeName);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findByIdAndDelete(req.params.id);
  if (!doc) throw new ApiError(404, 'Document not found');
  try { fs.unlinkSync(path.join(privateUploadDir, path.basename(doc.filePath))); } catch { /* file already gone */ }
  res.json({ success: true, message: 'Document deleted' });
});
