import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  studentCreateSchema, studentUpdateSchema,
  teacherCreateSchema, teacherUpdateSchema,
  classCreateSchema, classUpdateSchema,
  feeCreateSchema,
  noticeCreateSchema, noticeUpdateSchema,
  eventCreateSchema, eventUpdateSchema,
  galleryCreateSchema, galleryUpdateSchema,
  testimonialCreateSchema, testimonialUpdateSchema,
  queryParam,
} from '../validators/index.js';

// Phase 4A — pure schema-level regression tests. These import ONLY
// validators/index.js (zod, no mongoose, no network), so they run anywhere
// node --test runs, including environments where mongodb-memory-server
// cannot download a mongod binary. HTTP-level coverage lives in
// phase4Validation.test.js.

const OID = '665f1c2a9b3e4d5a6b7c8d9e'; // well-formed 24-hex ObjectId

describe('Phase 4A — student schemas', () => {
  const valid = {
    firstName: 'Aarav', lastName: 'Sharma', gender: 'Male', dob: '2012-04-01',
    rollNumber: 'RPS9001', class: OID, fatherName: 'Rohit Sharma',
    motherName: 'Pooja Sharma', phone: '9876500001', email: 'aarav@example.com',
    address: { line1: '12 Lane', city: 'Meerut', district: 'Meerut', state: 'UP', pincode: '250001' },
  };

  test('accepts a fully valid create payload', () => {
    assert.equal(studentCreateSchema.safeParse(valid).success, true);
  });

  test('accepts numeric-string and optional-field variants the frontend sends', () => {
    const r = studentCreateSchema.safeParse({ ...valid, lastName: '', email: '' });
    assert.equal(r.success, true);
  });

  test('rejects a malformed email', () => {
    assert.equal(studentCreateSchema.safeParse({ ...valid, email: 'not-an-email' }).success, false);
  });

  test('rejects a malformed date of birth', () => {
    assert.equal(studentCreateSchema.safeParse({ ...valid, dob: 'not-a-date' }).success, false);
    assert.equal(studentCreateSchema.safeParse({ ...valid, dob: '' }).success, false);
  });

  test('rejects a value outside the gender enum', () => {
    assert.equal(studentCreateSchema.safeParse({ ...valid, gender: 'Unknown' }).success, false);
  });

  test('rejects a malformed class ObjectId', () => {
    assert.equal(studentCreateSchema.safeParse({ ...valid, class: 'not-an-id' }).success, false);
    assert.equal(studentCreateSchema.safeParse({ ...valid, class: { $ne: null } }).success, false);
  });

  test('rejects a status outside the model enum', () => {
    assert.equal(studentCreateSchema.safeParse({ ...valid, status: 'graduated' }).success, false);
  });

  test('strips unknown fields instead of letting them through (no mass assignment)', () => {
    const r = studentCreateSchema.safeParse({ ...valid, role: 'admin', password: 'x', isAdmin: true });
    assert.equal(r.success, true);
    assert.equal(Object.prototype.hasOwnProperty.call(r.data, 'role'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(r.data, 'password'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(r.data, 'isAdmin'), false);
  });

  test('update schema allows partial updates but still validates provided fields', () => {
    assert.equal(studentUpdateSchema.safeParse({ phone: '9876500002' }).success, true);
    assert.equal(studentUpdateSchema.safeParse({}).success, true);
    assert.equal(studentUpdateSchema.safeParse({ email: 'nope' }).success, false);
    assert.equal(studentUpdateSchema.safeParse({ dob: '2012-13-99' }).success, false);
    // The frontend edit flow spreads the fetched doc (_id, createdAt, …) into
    // the PUT body — those extra keys must be stripped, not rejected.
    const spread = studentUpdateSchema.safeParse({ firstName: 'Aarav', _id: OID, createdAt: '2026-01-01T00:00:00Z', __v: 0 });
    assert.equal(spread.success, true);
    assert.equal(Object.prototype.hasOwnProperty.call(spread.data, 'createdAt'), false);
  });
});

describe('Phase 4A — teacher schemas', () => {
  const valid = {
    name: 'Mrs. Test Teacher', designation: 'TGT Maths', qualification: 'M.Sc., B.Ed.',
    department: 'Mathematics', subjects: ['Mathematics'], experienceYears: 8,
    email: 't@example.com', phone: '9876500002', bio: 'Teaches maths.',
  };

  test('accepts a valid create payload', () => {
    assert.equal(teacherCreateSchema.safeParse(valid).success, true);
  });

  test('rejects a missing required name', () => {
    const { name, ...rest } = valid;
    assert.equal(teacherCreateSchema.safeParse(rest).success, false);
  });

  test('rejects negative experience and non-numeric experience', () => {
    assert.equal(teacherCreateSchema.safeParse({ ...valid, experienceYears: -2 }).success, false);
    assert.equal(teacherCreateSchema.safeParse({ ...valid, experienceYears: 'lots' }).success, false);
  });

  test('accepts numeric-string experience (frontend number inputs)', () => {
    const r = teacherCreateSchema.safeParse({ ...valid, experienceYears: '12' });
    assert.equal(r.success, true);
    assert.equal(r.data.experienceYears, 12);
  });

  test('rejects a malformed email, strips unknown fields', () => {
    assert.equal(teacherCreateSchema.safeParse({ ...valid, email: 'bad' }).success, false);
    const r = teacherCreateSchema.safeParse({ ...valid, isActive: false, hacked: 1 });
    assert.equal(r.success, true);
    assert.equal(Object.prototype.hasOwnProperty.call(r.data, 'hacked'), false);
  });

  test('update schema is partial', () => {
    assert.equal(teacherUpdateSchema.safeParse({ bio: 'x' }).success, true);
    assert.equal(teacherUpdateSchema.safeParse({ name: 'y' }).success, false); // too short
  });
});

describe('Phase 4A — class schemas', () => {
  test('accepts a class without a class teacher (existing app behavior)', () => {
    const r = classCreateSchema.safeParse({ name: 'Class 11', section: 'B' });
    assert.equal(r.success, true);
  });

  test('accepts null and empty-string classTeacher as "no teacher"', () => {
    assert.equal(classCreateSchema.safeParse({ name: 'C', section: 'A', classTeacher: null }).success, true);
    const r = classCreateSchema.safeParse({ name: 'C', section: 'A', classTeacher: '' });
    assert.equal(r.success, true);
    assert.equal(r.data.classTeacher, null);
  });

  test('accepts a well-formed classTeacher ObjectId (existence checked in controller)', () => {
    assert.equal(classCreateSchema.safeParse({ name: 'C', section: 'A', classTeacher: OID }).success, true);
  });

  test('rejects a malformed classTeacher ObjectId', () => {
    assert.equal(classCreateSchema.safeParse({ name: 'C', section: 'A', classTeacher: 'nope' }).success, false);
    assert.equal(classCreateSchema.safeParse({ name: 'C', section: 'A', classTeacher: { $ne: null } }).success, false);
  });

  test('rejects a level outside the enum and malformed capacity', () => {
    assert.equal(classCreateSchema.safeParse({ name: 'C', section: 'A', level: 'PhD' }).success, false);
    assert.equal(classCreateSchema.safeParse({ name: 'C', section: 'A', capacity: 'many' }).success, false);
    assert.equal(classCreateSchema.safeParse({ name: 'C', section: 'A', capacity: -5 }).success, false);
  });

  test('update schema is partial and strips unknown keys', () => {
    assert.equal(classUpdateSchema.safeParse({ section: 'C' }).success, true);
    const r = classUpdateSchema.safeParse({ section: 'C', updatedAt: 'x' });
    assert.equal(r.success, true);
    assert.equal(Object.prototype.hasOwnProperty.call(r.data, 'updatedAt'), false);
  });
});

describe('Phase 4A — fee schema', () => {
  const valid = { rollNumber: 'RPS1001', title: 'Annual Fee', session: '2026-27', totalAmount: 5000, dueDate: '2026-10-01', note: '' };

  test('accepts a valid fee with a numeric amount', () => {
    assert.equal(feeCreateSchema.safeParse(valid).success, true);
  });

  test('accepts a numeric-STRING amount (frontend sends input values as strings)', () => {
    const r = feeCreateSchema.safeParse({ ...valid, totalAmount: '5000' });
    assert.equal(r.success, true);
    assert.equal(r.data.totalAmount, 5000);
  });

  test('rejects zero — a zero-total fee would instantly read as Paid', () => {
    assert.equal(feeCreateSchema.safeParse({ ...valid, totalAmount: 0 }).success, false);
    assert.equal(feeCreateSchema.safeParse({ ...valid, totalAmount: '0' }).success, false);
  });

  test('rejects negative amounts', () => {
    assert.equal(feeCreateSchema.safeParse({ ...valid, totalAmount: -500 }).success, false);
  });

  test('rejects NaN-producing and Infinity amounts', () => {
    assert.equal(feeCreateSchema.safeParse({ ...valid, totalAmount: 'abc' }).success, false);
    assert.equal(feeCreateSchema.safeParse({ ...valid, totalAmount: NaN }).success, false);
    assert.equal(feeCreateSchema.safeParse({ ...valid, totalAmount: Infinity }).success, false);
    assert.equal(feeCreateSchema.safeParse({ ...valid, totalAmount: { $numberDecimal: '5' } }).success, false);
  });

  test('rejects a malformed dueDate but treats empty dueDate as "none"', () => {
    assert.equal(feeCreateSchema.safeParse({ ...valid, dueDate: 'next tuesday maybe' }).success, false);
    assert.equal(feeCreateSchema.safeParse({ ...valid, dueDate: '2026-02-30' }).success, false);
    const r = feeCreateSchema.safeParse({ ...valid, dueDate: '' });
    assert.equal(r.success, true);
    // '' means "no due date": parsed to undefined, so the controller's
    // Fee.create({...dueDate}) behaves exactly like the old '' -> null cast.
    assert.equal(r.data.dueDate, undefined);
  });

  test('enforces title/rollNumber presence and length limits', () => {
    assert.equal(feeCreateSchema.safeParse({ ...valid, title: '' }).success, false);
    assert.equal(feeCreateSchema.safeParse({ ...valid, title: 'x'.repeat(201) }).success, false);
    assert.equal(feeCreateSchema.safeParse({ ...valid, rollNumber: '' }).success, false);
  });
});

describe('Phase 4A — notice / event schemas', () => {
  test('notice accepts multipart string booleans and enum category', () => {
    const r = noticeCreateSchema.safeParse({ title: 'Hi', description: 'Body text', category: 'Academic', isImportant: 'true', isPublished: 'false' });
    assert.equal(r.success, true);
    assert.equal(r.data.isImportant, 'true'); // controller does the 'true' -> true coercion, unchanged
  });

  test('notice rejects bad category and oversized title', () => {
    assert.equal(noticeCreateSchema.safeParse({ title: 'Hi', description: 'Body', category: 'Random' }).success, false);
    assert.equal(noticeCreateSchema.safeParse({ title: 'x'.repeat(301), description: 'Body' }).success, false);
  });

  test('notice update is partial', () => {
    assert.equal(noticeUpdateSchema.safeParse({ isPublished: 'false' }).success, true);
    assert.equal(noticeUpdateSchema.safeParse({ category: 'Nope' }).success, false);
  });

  test('event requires a parseable date', () => {
    assert.equal(eventCreateSchema.safeParse({ title: 'Fete', description: 'Fun', date: '2026-11-14' }).success, true);
    assert.equal(eventCreateSchema.safeParse({ title: 'Fete', description: 'Fun', date: 'whenever' }).success, false);
    assert.equal(eventCreateSchema.safeParse({ title: 'Fete', description: 'Fun', date: '' }).success, false);
  });

  test('event update is partial and validates dates when present', () => {
    assert.equal(eventUpdateSchema.safeParse({ location: 'Hall' }).success, true);
    assert.equal(eventUpdateSchema.safeParse({ date: 'not-a-date' }).success, false);
  });
});

describe('Phase 4A — gallery schemas', () => {
  test('accepts a valid gallery create (imagePath variant, no file)', () => {
    assert.equal(galleryCreateSchema.safeParse({ title: 'Sports Day', category: 'Sports', imagePath: '/uploads/x.jpg' }).success, true);
  });

  test('order: valid integer (or numeric string) is kept', () => {
    assert.equal(galleryCreateSchema.safeParse({ title: 'T', order: 3 }).data.order, 3);
    assert.equal(galleryCreateSchema.safeParse({ title: 'T', order: '4' }).data.order, 4);
  });

  test('order: malformed values are REJECTED, not silently coerced to 0', () => {
    assert.equal(galleryCreateSchema.safeParse({ title: 'T', order: 'abc' }).success, false);
    assert.equal(galleryCreateSchema.safeParse({ title: 'T', order: '1.5' }).success, false);
    assert.equal(galleryCreateSchema.safeParse({ title: 'T', order: { $inc: 1 } }).success, false);
  });

  test('order: absent or empty string still means "default" (controller applies 0)', () => {
    const absent = galleryCreateSchema.safeParse({ title: 'T' });
    assert.equal(absent.success, true);
    assert.equal(Object.prototype.hasOwnProperty.call(absent.data, 'order'), false);
    const empty = galleryCreateSchema.safeParse({ title: 'T', order: '' });
    assert.equal(empty.success, true);
    // '' parses to undefined — the controller's `req.body.order ?? 0` then
    // applies the same default 0 as before, so nothing changes for callers.
    assert.equal(empty.data.order, undefined);
  });

  test('gallery update is partial', () => {
    assert.equal(galleryUpdateSchema.safeParse({ caption: 'x' }).success, true);
    assert.equal(galleryUpdateSchema.safeParse({ title: '' }).success, false);
  });
});

describe('Phase 4A — testimonial schemas', () => {
  test('accepts a valid testimonial', () => {
    assert.equal(testimonialCreateSchema.safeParse({ name: 'A Parent', message: 'Great school overall.', rating: 5, isPublished: true }).success, true);
  });

  test('rating must be an integer between 1 and 5 (numeric strings accepted)', () => {
    assert.equal(testimonialCreateSchema.safeParse({ name: 'A Parent', message: 'Great school.', rating: 7 }).success, false);
    assert.equal(testimonialCreateSchema.safeParse({ name: 'A Parent', message: 'Great school.', rating: 0 }).success, false);
    assert.equal(testimonialCreateSchema.safeParse({ name: 'A Parent', message: 'Great school.', rating: 4.5 }).success, false);
    const r = testimonialCreateSchema.safeParse({ name: 'A Parent', message: 'Great school.', rating: '4' });
    assert.equal(r.success, true);
    assert.equal(r.data.rating, 4);
  });

  test('rejects too-short message, strips unknown fields', () => {
    assert.equal(testimonialCreateSchema.safeParse({ name: 'A Parent', message: 'hi' }).success, false);
    const r = testimonialCreateSchema.safeParse({ name: 'A Parent', message: 'Lovely campus.', injected: true });
    assert.equal(r.success, true);
    assert.equal(Object.prototype.hasOwnProperty.call(r.data, 'injected'), false);
  });

  test('update schema is partial', () => {
    assert.equal(testimonialUpdateSchema.safeParse({ isPublished: 'false' }).success, true);
    assert.equal(testimonialUpdateSchema.safeParse({ rating: 9 }).success, false);
  });
});

describe('Phase 4A — queryParam helper', () => {
  test('passes plain strings through unchanged', () => {
    assert.equal(queryParam('active'), 'active');
    assert.equal(queryParam(''), '');
  });

  test('ignores operator-style objects, arrays and other non-strings', () => {
    assert.equal(queryParam({ $ne: 'active' }), undefined);
    assert.equal(queryParam({ $in: ['a', 'b'] }), undefined);
    assert.equal(queryParam({ $regex: '.*' }), undefined);
    assert.equal(queryParam(['active']), undefined);
    assert.equal(queryParam(42), undefined);
    assert.equal(queryParam(null), undefined);
    assert.equal(queryParam(undefined), undefined);
  });
});
