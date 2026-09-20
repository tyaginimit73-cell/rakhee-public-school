import jwt from 'jsonwebtoken';

// `passwordVersion` (optional, defaults to 0) is embedded as the `pv` claim
// and checked against the user document on every authenticated request —
// see middleware/auth.js and the note on User.passwordVersion in models/User.js.
// Keeping it optional in the signature means any caller that doesn't know the
// version still produces a token that validates for never-rotated accounts.
export const signToken = (userId, passwordVersion = 0) =>
  jwt.sign({ id: userId, pv: passwordVersion || 0 }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

export const setAuthCookie = (res, token) => {
  res.cookie('rps_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
export const clearAuthCookie = (res) => res.clearCookie('rps_token');

// Short-lived, narrowly-scoped token that authorizes document uploads for
// exactly one admission application. Issued once, in the response to a
// successful submission, and consumed by the immediate follow-up upload
// call the same browser session makes. This replaces "anyone who knows or
// guesses the applicationId can upload files to it" (the applicationId is
// a predictable sequential string, not a secret) with "you must possess
// the token that was only ever returned to the person who just submitted
// this specific application." See PROJECT_AUDIT.md.
const UPLOAD_TOKEN_PURPOSE = 'admission-docs';
const UPLOAD_TOKEN_TTL = '60m';

export const signAdmissionUploadToken = (applicationId) =>
  jwt.sign({ applicationId, purpose: UPLOAD_TOKEN_PURPOSE }, process.env.JWT_SECRET, { expiresIn: UPLOAD_TOKEN_TTL });

// Returns the verified payload, or null if the token is missing/invalid/
// expired/for a different application — callers just need a yes/no.
export const verifyAdmissionUploadToken = (token, applicationId) => {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose !== UPLOAD_TOKEN_PURPOSE || payload.applicationId !== applicationId) return null;
    return payload;
  } catch {
    return null;
  }
};
