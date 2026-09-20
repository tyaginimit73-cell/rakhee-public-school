import path from 'node:path';
import fs from 'node:fs';
import { Admission } from '../models/Admission.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paged } from '../utils/paginate.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { signAdmissionUploadToken, verifyAdmissionUploadToken } from '../utils/token.js';
import { cleanupFiles } from '../middleware/upload.js';
import { privateUploadDir } from '../utils/paths.js';
import { trackSchema } from '../validators/index.js';

// Public: submit application
export const submitAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.create(req.body);
  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: {
      applicationId: admission.applicationId,
      status: admission.status,
      // Short-lived, narrowly-scoped token authorizing document upload for
      // *this* application only, for a limited time — see utils/token.js.
      // The applicationId itself is a predictable sequential string and is
      // not, by itself, a secret capable of authorizing an upload.
      uploadToken: signAdmissionUploadToken(admission.applicationId),
    },
  });
});

// Public: attach documents after submission. Requires the uploadToken that
// was returned from submitAdmission for this exact applicationId — see
// PROJECT_AUDIT.md for why the applicationId alone used to be enough.
// By the time this runs, multer has already written req.files to disk
// (it's upstream middleware), so every rejection path below must clean
// those up itself — otherwise a rejected/unauthorized attempt would still
// leave files sitting in server/uploads.
export const uploadAdmissionDocs = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  if (!verifyAdmissionUploadToken(req.body.uploadToken, applicationId)) {
    cleanupFiles(req.files);
    throw new ApiError(401, 'This upload link has expired or is invalid. Documents can also be submitted at the school office.');
  }
  const admission = await Admission.findOne({ applicationId });
  if (!admission) {
    cleanupFiles(req.files);
    throw new ApiError(404, 'Application not found');
  }
  const files = req.files || [];
  const labels = Array.isArray(req.body.labels) ? req.body.labels : [req.body.labels].filter(Boolean);
  files.forEach((f, i) => {
    admission.documents.push({ label: labels[i] || f.originalname, filename: f.filename, originalName: f.originalname });
  });
  await admission.save();
  res.json({ success: true, message: `${files.length} document(s) uploaded`, data: { documents: admission.documents } });
});

// Admin-only: download one of an application's submitted documents. The
// filename is validated against THIS application's own stored documents
// array (not just sanitized) before anything is opened — so even an
// authenticated admin can't use this route to fetch an arbitrary
// filesystem path by supplying a filename that doesn't actually belong to
// this application, and path.basename() strips any directory traversal
// characters as a second layer regardless.
export const downloadAdmissionDocument = asyncHandler(async (req, res) => {
  const { applicationId, filename } = req.params;
  const admission = await Admission.findOne({ applicationId });
  if (!admission) throw new ApiError(404, 'Application not found');
  const doc = admission.documents.find((d) => d.filename === filename);
  if (!doc) throw new ApiError(404, 'Document not found on this application');
  const safeName = path.basename(doc.filename);
  const filePath = path.join(privateUploadDir, safeName);
  if (!fs.existsSync(filePath)) throw new ApiError(404, 'File not found on server');
  res.download(filePath, doc.originalName || safeName);
});

// Public: track application by applicationId + registered phone. Returns
// only the subset of fields an applicant should see — never admin notes,
// who changed the status, or internal review remarks. See PROJECT_AUDIT.md.
export const trackAdmission = asyncHandler(async (req, res) => {
  const parsed = trackSchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.errors.map((e) => e.message).join('; '));
  }
  const { applicationId, phone } = parsed.data;
  const admission = await Admission.findOne({ applicationId: applicationId.trim() });
  if (!admission || admission.phone !== phone.trim()) {
    throw new ApiError(404, 'No application found for the given Application ID and phone number');
  }
  res.json({
    success: true,
    data: {
      applicationId: admission.applicationId,
      studentName: admission.studentName,
      classApplyingFor: admission.classApplyingFor,
      status: admission.status,
      createdAt: admission.createdAt,
      statusHistory: admission.statusHistory.map((h) => ({ status: h.status, at: h.at })),
    },
  });
});

// Admin
export const listAdmissions = asyncHandler(async (req, res) => {
  const { status, search = '' } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ studentName: rx }, { applicationId: rx }, { phone: rx }];
  }
  const data = await paged(Admission.find(filter).sort('-createdAt'), req, Admission.countDocuments(filter));
  res.json({ success: true, data });
});

export const getAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) throw new ApiError(404, 'Application not found');
  res.json({ success: true, data: admission });
});

export const updateAdmissionStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!['Submitted', 'Under Review', 'Shortlisted', 'Approved', 'Rejected'].includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }
  const admission = await Admission.findById(req.params.id);
  if (!admission) throw new ApiError(404, 'Application not found');
  admission.status = status;
  admission.statusHistory.push({ status, by: req.user.name, note });
  await admission.save();
  res.json({ success: true, message: `Application marked as ${status}`, data: admission });
});

export const updateAdmissionNotes = asyncHandler(async (req, res) => {
  const admission = await Admission.findByIdAndUpdate(req.params.id, { notes: req.body.notes || '' }, { new: true });
  if (!admission) throw new ApiError(404, 'Application not found');
  res.json({ success: true, message: 'Notes saved', data: admission });
});

export const deleteAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findByIdAndDelete(req.params.id);
  if (!admission) throw new ApiError(404, 'Application not found');
  // Clean up the applicant's uploaded documents too — otherwise deleting
  // an application leaves their private files orphaned on disk forever.
  cleanupFiles((admission.documents || []).map((d) => ({ path: path.join(privateUploadDir, path.basename(d.filename)) })));
  res.json({ success: true, message: 'Application deleted' });
});
