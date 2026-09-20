import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import { verifyFileSignature } from '../utils/fileSignature.js';
import { publicUploadDir, privateUploadDir } from '../utils/paths.js';

fs.mkdirSync(publicUploadDir, { recursive: true });
fs.mkdirSync(privateUploadDir, { recursive: true });

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.doc', '.docx'];

const filename = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  // The saved filename is fully server-generated (timestamp + random hex);
  // none of the client-supplied originalname is used here, so there is no
  // path-traversal or overwrite risk from a crafted filename.
  cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED.includes(ext)) return cb(new Error(`File type ${ext} is not allowed`));
  cb(null, true);
};

const limits = { fileSize: 5 * 1024 * 1024, files: 5 };

// PUBLIC: gallery photos, event images, notice attachments — genuinely
// meant to be reachable by anyone. Served via express.static in app.js.
export const upload = multer({
  storage: multer.diskStorage({ destination: (req, file, cb) => cb(null, publicUploadDir), filename }),
  limits,
  fileFilter,
});

// PRIVATE: admission-submitted documents, and admin-uploaded records from
// the "Documents" section. Written to a directory that is never mounted
// with express.static anywhere (see utils/paths.js) — reachable only
// through the authenticated download endpoints in admissionController.js
// and documentController.js, never by a direct /uploads/<filename> URL.
export const privateUpload = multer({
  storage: multer.diskStorage({ destination: (req, file, cb) => cb(null, privateUploadDir), filename }),
  limits,
  fileFilter,
});

// Shared cleanup used whenever an upload must be rejected after multer has
// already written the file(s) to disk (token/authorization failures happen
// in the controller, which runs after multer — see admissionController.js).
export const cleanupFiles = (files = []) => {
  files.forEach((f) => { try { fs.unlinkSync(f.path); } catch { /* already gone */ } });
};

// Extension + client-supplied MIME type are both attacker-controlled and
// checked before any bytes exist on disk (multer streams to disk as it
// parses, so fileFilter above can't inspect content). This middleware runs
// *after* upload.single()/upload.array() (public OR private) has written
// the file(s), reads each one's real header, and rejects (deleting the
// file) anything whose content doesn't match its claimed extension — e.g.
// a script renamed to "photo.jpg". Apply it directly after any upload
// middleware, public or private.
export const verifyUploadedFiles = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  for (const file of files) {
    const ext = path.extname(file.filename).toLowerCase();
    if (!verifyFileSignature(file.path, ext)) {
      // Clean up every file from this request, not just the bad one, so
      // nothing invalid is left on disk even if one file in a multi-file
      // upload was fine.
      cleanupFiles(files);
      return res.status(400).json({
        success: false,
        message: `"${file.originalname}" does not look like a valid ${ext.replace('.', '').toUpperCase()} file. Please upload a genuine file of the correct type.`,
      });
    }
  }
  next();
};
