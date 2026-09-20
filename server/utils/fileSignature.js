// Lightweight "is this file actually what its extension claims" check.
//
// multer's fileFilter only sees the filename + client-supplied Content-Type
// before the bytes are written, both of which an attacker fully controls.
// This reads the first few bytes of the file that was actually written to
// disk and compares them against known magic numbers, so a file renamed
// from "shell.php" to "photo.jpg" (or an SVG containing script) still
// won't pass as a real JPEG. This is deliberately dependency-free (just
// fs + Buffer) because the sandbox this was built in has no network
// access to install a package like `file-type` — see PROJECT_AUDIT.md.
//
// This is a signature check, not a full parser: it stops trivial content
// spoofing, not a maliciously crafted-but-valid file of the allowed type.

import fs from 'node:fs';

// Each signature: bytes to match, at a given offset.
const SIGNATURES = {
  '.jpg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  '.jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  '.png': [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  '.gif': [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }], // "GIF8"
  '.webp': [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }], // RIFF....WEBP
  '.pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }], // "%PDF"
  '.doc': [{ offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }], // legacy OLE compound file
  // .docx (and .xlsx/.pptx) are zip containers — a plain "PK" header is the
  // strongest check practical without unzipping and inspecting entries.
  '.docx': [{ offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }],
};

const readHeader = (filePath, length = 16) => {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(length);
    const bytesRead = fs.readSync(fd, buf, 0, length, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    fs.closeSync(fd);
  }
};

const matches = (header, sig) => sig.bytes.every((b, i) => header[sig.offset + i] === b);

// Returns true if the file's real content matches its claimed extension,
// or if the extension has no known signature (nothing to check against).
export const verifyFileSignature = (filePath, ext) => {
  const rules = SIGNATURES[ext.toLowerCase()];
  if (!rules) return true; // no rule defined — don't block unknown-but-allowed types
  try {
    const header = readHeader(filePath, 16);
    return rules.every((sig) => matches(header, sig));
  } catch {
    return false; // unreadable file — treat as invalid rather than risk a crash
  }
};
