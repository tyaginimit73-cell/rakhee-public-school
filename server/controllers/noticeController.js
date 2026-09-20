import { Notice } from '../models/Notice.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paged } from '../utils/paginate.js';
import { cleanupReplacedPublicFile } from '../utils/fileCleanup.js';
import { queryParam } from '../validators/index.js';

export const listNotices = asyncHandler(async (req, res) => {
  const { all } = req.query;
  // queryParam() drops operator-style objects (?category[$ne]=x) — Phase 4A.
  const category = queryParam(req.query.category);
  const filter = {};
  // See teacherController.js for why this checks req.user via optionalAuth.
  if (!(all && req.user?.role === 'admin')) filter.isPublished = true;
  if (category) filter.category = category;
  const data = await paged(Notice.find(filter).sort('-isImportant -publishDate'), req, Notice.countDocuments(filter));
  res.json({ success: true, data });
});

export const createNotice = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.file) { body.attachmentPath = `/uploads/${req.file.filename}`; body.attachmentName = req.file.originalname; }
  ['isImportant', 'isPublished'].forEach((k) => { if (k in body) body[k] = body[k] === 'true' || body[k] === true; });
  const notice = await Notice.create(body);
  res.status(201).json({ success: true, message: 'Notice published', data: notice });
});

export const updateNotice = asyncHandler(async (req, res) => {
  const existing = await Notice.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Notice not found');
  const body = { ...req.body };
  if (req.file) { body.attachmentPath = `/uploads/${req.file.filename}`; body.attachmentName = req.file.originalname; }
  ['isImportant', 'isPublished'].forEach((k) => { if (k in body) body[k] = body[k] === 'true' || body[k] === true; });
  const notice = await Notice.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (req.file) await cleanupReplacedPublicFile(Notice, 'attachmentPath', existing.attachmentPath, notice.attachmentPath, notice._id);
  res.json({ success: true, message: 'Notice updated', data: notice });
});

export const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndDelete(req.params.id);
  if (!notice) throw new ApiError(404, 'Notice not found');
  await cleanupReplacedPublicFile(Notice, 'attachmentPath', notice.attachmentPath, null, notice._id);
  res.json({ success: true, message: 'Notice deleted' });
});
