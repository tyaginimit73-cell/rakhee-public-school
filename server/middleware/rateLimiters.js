import { rateLimit } from 'express-rate-limit';

// The blanket /api limiter (600 req / 15 min) is a reasonable ceiling for
// normal browsing, but it's far too loose for endpoints that are either
// public write actions (spam risk) or credential/identity checks (guessing
// risk). These give each of those a tighter, purpose-specific ceiling.
// Values are per-IP and deliberately generous for real users while still
// closing off cheap automated abuse. See PROJECT_AUDIT.md Phase 2.7.

const make = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message },
});

export const apiLimiter = make(15 * 60 * 1000, 600, 'Too many requests, please try again later.');

export const authLimiter = make(15 * 60 * 1000, 40, 'Too many attempts, please try again later.');

// Admission submission: a real family submits once (rarely a handful of
// times while fixing validation errors). 10/hour deters bulk/spam submits.
export const admissionSubmitLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, skip: () => process.env.NODE_ENV === 'test', message: { success: false, message: 'Too many applications submitted from this network. Please try again later or contact the school office.' }, });

// Document upload immediately follows a submission and may include a
// retry or two; a little looser than submission itself.
export const admissionUploadLimiter = make(60 * 60 * 1000, 20, 'Too many upload attempts. Please try again later.');

// Tracking takes an applicationId + phone — both guessable individually,
// so this is the main defense against brute-forcing the pair.
export const trackingLimiter = make(15 * 60 * 1000, 30, 'Too many tracking attempts. Please wait a few minutes and try again.');

// Result check takes roll number + DOB; DOB has limited entropy, so this
// closes off scripted guessing against a known roll number.
export const resultCheckLimiter = make(15 * 60 * 1000, 20, 'Too many attempts. Please wait a few minutes and try again.');

// Public contact/enquiry forms — anti-spam, not anti-guessing.
export const publicFormLimiter = make(60 * 60 * 1000, 10, 'Too many submissions from this network. Please try again later.');

// Authenticated password change — lower risk (already logged in) but still
// worth capping against a compromised-session brute-force of the current password.
export const passwordChangeLimiter = make(60 * 60 * 1000, 10, 'Too many attempts. Please try again later.');
