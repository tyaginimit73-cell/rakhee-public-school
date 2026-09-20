import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { startTestServer, stopTestServer } from './helpers/testServer.js';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { Teacher } from '../models/Teacher.js';
import { Class } from '../models/Class.js';
import { Fee } from '../models/Fee.js';
import { Result } from '../models/Result.js';
import { Attendance } from '../models/Attendance.js';
import { defaultSettings } from '../config/defaultSettings.js';

// Covers the Phase 2 integrity & session-hygiene pass (PROJECT_AUDIT.md):
//  - M1: atomic guarded fee payments (no overpayment under concurrency)
//  - M3: password rotation invalidates all pre-existing sessions (pv claim)
//  - M4: settings CMS PUT is schema-validated, dangerous keys stripped
//  - L6: student/teacher deletion blocked while dependent records exist

const login = async (baseUrl, email, password) => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, cookie: res.headers.getSetCookie()?.[0]?.split(';')[0], token: body?.data?.token, body };
};

const makeStudent = (cls, rollNumber, overrides = {}) => Student.create({
  firstName: 'Phase', lastName: 'Two', gender: 'Male', dob: '2013-03-03', rollNumber,
  class: cls, fatherName: 'F', motherName: 'M', phone: '9300000000',
  address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '250001' },
  admissionDate: '2024-04-01', ...overrides,
});

describe('M1 — atomic fee payment integrity', () => {
  let baseUrl, adminCookie, cls, student, feeSeq, feeConcurrent;

  before(async () => {
    baseUrl = await startTestServer();
    cls = await Class.create({ name: 'Class F', section: 'A', level: 'Primary' });
    student = await makeStudent(cls._id, 'P2F001');
    await User.create({ name: 'Admin Fees', email: 'admin-fees@test.local', password: 'CorrectHorse123', role: 'admin' });
    adminCookie = (await login(baseUrl, 'admin-fees@test.local', 'CorrectHorse123')).cookie;
    feeSeq = await Fee.create({ student: student._id, title: 'Tuition', session: '2026-27', totalAmount: 1000 });
    feeConcurrent = await Fee.create({ student: student._id, title: 'Transport', session: '2026-27', totalAmount: 1000 });
  });
  after(async () => { await stopTestServer(); });

  const pay = (feeId, body) => fetch(`${baseUrl}/api/fees/${feeId}/payments`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify(body),
  });

  test('a normal payment is recorded and keeps the existing response shape', async () => {
    const res = await pay(feeSeq._id, { amount: 300, method: 'Cash', note: 'first installment' });
    assert.equal(res.status, 200);
    const body = await res.json();
    // shape preserved for the admin Fees receipt modal:
    assert.equal(body.data.fee.paidAmount, 300);
    assert.equal(body.data.fee.status, 'Partial');
    assert.equal(body.data.fee.pendingAmount, 700); // toJSON virtual still present
    assert.equal(body.data.fee.student.firstName, 'Phase'); // populate preserved
    assert.equal(body.data.receipt.amount, 300);
    assert.ok(/^RCP-/.test(body.data.receipt.receiptNo));
    assert.ok(body.data.receipt.date);
  });

  test('a payment exactly equal to the remaining balance settles the fee', async () => {
    const res = await pay(feeSeq._id, { amount: 700 });
    assert.equal(res.status, 200);
    const fresh = await Fee.findById(feeSeq._id);
    assert.equal(fresh.paidAmount, 1000);
    assert.equal(fresh.status, 'Paid'); // status derivation preserved
    assert.equal(fresh.payments.length, 2); // history preserved
  });

  test('a payment greater than the remaining balance is rejected and changes nothing', async () => {
    const before = await Fee.findById(feeSeq._id);
    const res = await pay(feeSeq._id, { amount: 100 });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /exceeds pending balance/i);
    const fresh = await Fee.findById(feeSeq._id);
    assert.equal(fresh.paidAmount, before.paidAmount);
    assert.equal(fresh.payments.length, before.payments.length);
  });

  test('invalid amounts are rejected (0, negative, non-numeric)', async () => {
    for (const amount of [0, -50, 'abc']) {
      const res = await pay(feeSeq._id, { amount });
      assert.equal(res.status, 400, `amount ${JSON.stringify(amount)} should be rejected`);
    }
    const badMethod = await pay(feeSeq._id, { amount: 10, method: 'Bitcoin' });
    assert.equal(badMethod.status, 400);
  });

  test('malformed and nonexistent fee ids return 400/404, not 500', async () => {
    const malformed = await pay('abc', { amount: 10 });
    assert.equal(malformed.status, 400);
    const missing = await pay(new mongoose.Types.ObjectId(), { amount: 10 });
    assert.equal(missing.status, 404);
  });

  test('CONCURRENCY: racing payments can never push paidAmount past totalAmount', async () => {
    // 5 parallel payments of 300 against a 1000 fee — at most 3 can fit.
    const results = await Promise.all(
      Array.from({ length: 5 }, () => pay(feeConcurrent._id, { amount: 300, method: 'UPI' })),
    );
    const statuses = results.map((r) => r.status).sort();
    assert.deepEqual(statuses, [200, 200, 200, 400, 400]); // exactly 3 fit, 2 rejected

    const fresh = await Fee.findById(feeConcurrent._id);
    assert.ok(fresh.paidAmount <= fresh.totalAmount, 'paidAmount must never exceed totalAmount');
    assert.equal(fresh.paidAmount, 900);
    assert.equal(fresh.payments.length, 3); // no phantom/duplicate payments
    assert.equal(fresh.payments.reduce((s, p) => s + p.amount, 0), fresh.paidAmount); // history consistent
    assert.equal(fresh.status, 'Partial');
    // every receipt number is unique even though all 5 raced in one instant
    assert.equal(new Set(fresh.payments.map((p) => p.receiptNo)).size, fresh.payments.length);
  });
});

describe('M3 — password rotation invalidates old sessions', () => {
  let baseUrl, adminCookie;
  const EMAIL_A = 'user-a@test.local';
  const EMAIL_B = 'user-b@test.local';
  const PW_A = 'OriginalPass123';

  before(async () => {
    baseUrl = await startTestServer();
    await User.create({ name: 'User A', email: EMAIL_A, password: PW_A, role: 'parent' });
    await User.create({ name: 'User B', email: EMAIL_B, password: 'OtherPass123', role: 'parent' });
    await User.create({ name: 'Admin Sessions', email: 'admin-sessions@test.local', password: 'CorrectHorse123', role: 'admin' });
    adminCookie = (await login(baseUrl, 'admin-sessions@test.local', 'CorrectHorse123')).cookie;
  });
  after(async () => { await stopTestServer(); });

  let cookieA, bearerA, cookieB;

  test('login creates a valid session — cookie and Bearer both work', async () => {
    const a = await login(baseUrl, EMAIL_A, PW_A);
    assert.equal(a.status, 200);
    cookieA = a.cookie; bearerA = a.token;
    const meCookie = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookieA } });
    assert.equal(meCookie.status, 200);
    const meBearer = await fetch(`${baseUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${bearerA}` } });
    assert.equal(meBearer.status, 200);
    // unrelated user gets their own independent session
    cookieB = (await login(baseUrl, EMAIL_B, 'OtherPass123')).cookie;
  });

  test('normal requests keep working while no password rotation happens', async () => {
    for (let i = 0; i < 3; i += 1) {
      const res = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookieA } });
      assert.equal(res.status, 200);
    }
  });

  test('after self-service password change, ALL previous sessions (cookie + Bearer) are dead', async () => {
    const change = await fetch(`${baseUrl}/api/auth/password`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ currentPassword: PW_A, newPassword: 'RotatedPass456' }),
    });
    assert.equal(change.status, 200);
    const oldCookie = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookieA } });
    assert.equal(oldCookie.status, 401, 'old cookie session must be invalidated');
    const oldBearer = await fetch(`${baseUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${bearerA}` } });
    assert.equal(oldBearer.status, 401, 'old Bearer session must be invalidated');
  });

  test('old password no longer logs in; new password does', async () => {
    const oldLogin = await login(baseUrl, EMAIL_A, PW_A);
    assert.equal(oldLogin.status, 401);
    const newLogin = await login(baseUrl, EMAIL_A, 'RotatedPass456');
    assert.equal(newLogin.status, 200);
    cookieA = newLogin.cookie;
    const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookieA } });
    assert.equal(me.status, 200, 'session from the new password works normally');
  });

  test('after an ADMIN reset, the target user\'s current session dies; reset password logs in', async () => {
    const target = await User.findOne({ email: EMAIL_A });
    const reset = await fetch(`${baseUrl}/api/users/${target._id}/password`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ newPassword: 'AdminReset789' }),
    });
    assert.equal(reset.status, 200);
    const dead = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookieA } });
    assert.equal(dead.status, 401, 'session issued before the admin reset must be invalidated');
    const fresh = await login(baseUrl, EMAIL_A, 'AdminReset789');
    assert.equal(fresh.status, 200, 'login with the reset password works');
    const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: fresh.cookie } });
    assert.equal(me.status, 200);
  });

  test('an UNRELATED user\'s session survives all of user A\'s rotations', async () => {
    const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookieB } });
    assert.equal(me.status, 200, 'user B took no action — their session must be untouched');
  });
});

describe('M4 — settings CMS validation', () => {
  let baseUrl, adminCookie, parentCookie;

  before(async () => {
    baseUrl = await startTestServer();
    await User.create({ name: 'Admin CMS', email: 'admin-cms@test.local', password: 'CorrectHorse123', role: 'admin' });
    await User.create({ name: 'Parent CMS', email: 'parent-cms@test.local', password: 'CorrectHorse123', role: 'parent' });
    adminCookie = (await login(baseUrl, 'admin-cms@test.local', 'CorrectHorse123')).cookie;
    parentCookie = (await login(baseUrl, 'parent-cms@test.local', 'CorrectHorse123')).cookie;
  });
  after(async () => { await stopTestServer(); });

  const putSettings = (body, cookie = adminCookie, raw = false) => fetch(`${baseUrl}/api/settings`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: raw ? body : JSON.stringify(body),
  });
  const getPublic = async () => (await fetch(`${baseUrl}/api/settings`)).json();

  test('a valid settings update is saved and served publicly', async () => {
    const res = await putSettings({ site: { phone: '+91 11111 11111' }, announcement: 'Phase 2 bar' });
    assert.equal(res.status, 200);
    const pub = await getPublic();
    assert.equal(pub.data.site.phone, '+91 11111 11111');
    assert.equal(pub.data.announcement, 'Phase 2 bar');
    // untouched defaults still merge through
    assert.equal(pub.data.site.schoolName, defaultSettings.site.schoolName);
  });

  test('a valid NESTED partial update merges without clobbering siblings', async () => {
    const res = await putSettings({ hero: { headline: 'New headline only' } });
    assert.equal(res.status, 200);
    const pub = await getPublic();
    assert.equal(pub.data.hero.headline, 'New headline only');
    assert.equal(pub.data.hero.image, defaultSettings.hero.image); // sibling preserved
  });

  test('invalid types are rejected (boolean, number, array/object shape)', async () => {
    for (const body of [
      { admissionOpen: 'yes' },                    // must be boolean
      { stats: 'not-an-array' },                   // must be array
      { site: ['not', 'an', 'object'] },           // must be object
      { stats: [{ value: 'not-a-number' }] },      // stat value must be number
      { facilities: [{ items: [{ available: 'yes' }] }] }, // must be boolean
    ]) {
      const res = await putSettings(body);
      assert.equal(res.status, 400, `${JSON.stringify(body)} should be rejected`);
    }
    // and a rejected save must not have altered anything
    const pub = await getPublic();
    assert.equal(pub.data.hero.headline, 'New headline only');
  });

  test('unknown keys are stripped, known siblings in the same body still apply', async () => {
    const res = await putSettings({ feesNote: 'Updated note', bogusKey: { anything: true }, site: { tagline: 'Still applies' } });
    assert.equal(res.status, 200);
    const pub = await getPublic();
    assert.equal(pub.data.feesNote, 'Updated note');
    assert.equal(pub.data.site.tagline, 'Still applies');
    assert.ok(!('bogusKey' in pub.data), 'unknown key must not be persisted or served');
  });

  test('__proto__ payload cannot pollute anything', async () => {
    const res = await putSettings('{"site":{"phone":"+91 22222 22222"},"__proto__":{"pwned":true}}', adminCookie, true);
    assert.equal(res.status, 200);
    assert.equal(({}).pwned, undefined, 'Object.prototype must be untouched');
    const pub = await getPublic();
    assert.equal(pub.data.pwned, undefined);
    assert.ok(!('pwned' in pub.data.site));
    assert.equal(pub.data.site.phone, '+91 22222 22222'); // legitimate part still applied
  });

  test('constructor payload is stripped and cannot poison the document', async () => {
    const res = await putSettings('{"constructor":{"prototype":{"pwned2":true}},"announcement":"still fine"}', adminCookie, true);
    assert.equal(res.status, 200);
    assert.equal(({}).pwned2, undefined);
    const pub = await getPublic();
    assert.equal(pub.data.announcement, 'still fine');
    assert.ok(!Object.prototype.hasOwnProperty.call(pub.data, 'constructor'), 'no own constructor key in served settings');
  });

  test('prototype payload is stripped too', async () => {
    const res = await putSettings({ prototype: { pwned3: true }, feesNote: 'Note survives' });
    assert.equal(res.status, 200);
    const pub = await getPublic();
    assert.equal(pub.data.feesNote, 'Note survives');
    assert.ok(!Object.prototype.hasOwnProperty.call(pub.data, 'prototype'));
    assert.equal(({}).pwned3, undefined);
  });

  test('settings updates remain admin-only (401 anonymous, 403 non-admin)', async () => {
    const anon = await putSettings({ announcement: 'nope' }, null);
    assert.equal(anon.status, 401);
    const asParent = await putSettings({ announcement: 'nope' }, parentCookie);
    assert.equal(asParent.status, 403);
    const pub = await getPublic();
    assert.equal(pub.data.announcement, 'still fine'); // nothing changed
  });

  test('public GET still returns the complete, valid CMS document', async () => {
    const res = await fetch(`${baseUrl}/api/settings`);
    assert.equal(res.status, 200);
    const pub = await res.json();
    assert.equal(typeof pub.data.site.schoolName, 'string');
    assert.ok(Array.isArray(pub.data.stats));
    assert.ok(Array.isArray(pub.data.facilities));
    assert.equal(typeof pub.data.admissionOpen, 'boolean');
    assert.equal(pub.data.about.values.length, defaultSettings.about.values.length);
  });
});

describe('L6 — safe student/teacher deletion with dependent records', () => {
  let baseUrl, adminCookie, cls;
  let sFree, sFee, sResult, sAtt, sUser, tLinked, tAssigned, tFree;

  before(async () => {
    baseUrl = await startTestServer();
    await User.create({ name: 'Admin L6', email: 'admin-l6@test.local', password: 'CorrectHorse123', role: 'admin' });
    adminCookie = (await login(baseUrl, 'admin-l6@test.local', 'CorrectHorse123')).cookie;
    cls = await Class.create({ name: 'Class L6', section: 'A', level: 'Primary' });

    sFree = await makeStudent(cls._id, 'P2L001');
    sFee = await makeStudent(cls._id, 'P2L002');
    sResult = await makeStudent(cls._id, 'P2L003');
    sAtt = await makeStudent(cls._id, 'P2L004');
    sUser = await makeStudent(cls._id, 'P2L005');

    await Fee.create({ student: sFee._id, title: 'Tuition', session: '2026-27', totalAmount: 500 });
    await Result.create({ student: sResult._id, exam: 'Unit Test', session: '2026-27', subjects: [{ name: 'Maths', maxMarks: 100, obtainedMarks: 70 }] });
    await Attendance.create({ class: cls._id, date: '2026-09-19', records: [{ student: sAtt._id, status: 'Present' }] });
    await User.create({ name: 'Parent Of L5', email: 'parent-l6@test.local', password: 'CorrectHorse123', role: 'parent', students: [sUser._id] });

    tLinked = await Teacher.create({ name: 'Linked Teacher', designation: 'TGT', qualification: 'B.Ed', department: 'Hindi' });
    await User.create({ name: 'Teacher Login', email: 'teacher-l6@test.local', password: 'CorrectHorse123', role: 'teacher', teacher: tLinked._id });
    tAssigned = await Teacher.create({ name: 'Class Teacher', designation: 'TGT', qualification: 'B.Ed', department: 'English' });
    await Class.create({ name: 'Class L6B', section: 'B', level: 'Primary', classTeacher: tAssigned._id });
    tFree = await Teacher.create({ name: 'Unreferenced Teacher', designation: 'TGT', qualification: 'B.Ed', department: 'Art' });
  });
  after(async () => { await stopTestServer(); });

  const del = (path) => fetch(`${baseUrl}${path}`, { method: 'DELETE', headers: { Cookie: adminCookie } });

  test('deleting an UNREFERENCED student works normally', async () => {
    const res = await del(`/api/students/${sFree._id}`);
    assert.equal(res.status, 200);
    assert.equal(await Student.findById(sFree._id), null);
  });

  test('deleting a student with a Fee is blocked; nothing is removed', async () => {
    const res = await del(`/api/students/${sFee._id}`);
    assert.equal(res.status, 400);
    assert.match((await res.json()).message, /fee record/i);
    assert.ok(await Student.findById(sFee._id), 'student must remain');
    assert.ok(await Fee.findOne({ student: sFee._id }), 'fee must remain');
  });

  test('deleting a student with a Result is blocked; nothing is removed', async () => {
    const res = await del(`/api/students/${sResult._id}`);
    assert.equal(res.status, 400);
    assert.match((await res.json()).message, /result record/i);
    assert.ok(await Student.findById(sResult._id));
    assert.ok(await Result.findOne({ student: sResult._id }));
  });

  test('deleting a student with Attendance is blocked; nothing is removed', async () => {
    const res = await del(`/api/students/${sAtt._id}`);
    assert.equal(res.status, 400);
    assert.match((await res.json()).message, /attendance record/i);
    assert.ok(await Student.findById(sAtt._id));
    assert.ok(await Attendance.findOne({ 'records.student': sAtt._id }));
  });

  test('deleting a student linked to a User account is blocked; nothing is removed', async () => {
    const res = await del(`/api/students/${sUser._id}`);
    assert.equal(res.status, 400);
    assert.match((await res.json()).message, /user account/i);
    assert.ok(await Student.findById(sUser._id));
    assert.ok(await User.findOne({ students: sUser._id }));
  });

  test('deleting an UNREFERENCED teacher works normally', async () => {
    const res = await del(`/api/teachers/${tFree._id}`);
    assert.equal(res.status, 200);
    assert.equal(await Teacher.findById(tFree._id), null);
  });

  test('deleting a teacher linked to a User account is blocked; nothing is removed', async () => {
    const res = await del(`/api/teachers/${tLinked._id}`);
    assert.equal(res.status, 400);
    assert.match((await res.json()).message, /user account/i);
    assert.ok(await Teacher.findById(tLinked._id));
    assert.ok(await User.findOne({ teacher: tLinked._id }));
  });

  test('deleting a teacher assigned to a Class is blocked; nothing is removed', async () => {
    const res = await del(`/api/teachers/${tAssigned._id}`);
    assert.equal(res.status, 400);
    assert.match((await res.json()).message, /class/i);
    assert.ok(await Teacher.findById(tAssigned._id));
    assert.ok(await Class.findOne({ classTeacher: tAssigned._id }));
  });

  test('malformed and nonexistent ids behave safely (no 500s)', async () => {
    const studentMalformed = await del('/api/students/abc');
    assert.equal(studentMalformed.status, 400);
    const teacherMalformed = await del('/api/teachers/not-an-id');
    assert.equal(teacherMalformed.status, 400);
    const studentMissing = await del(`/api/students/${new mongoose.Types.ObjectId()}`);
    assert.equal(studentMissing.status, 404);
    const teacherMissing = await del(`/api/teachers/${new mongoose.Types.ObjectId()}`);
    assert.equal(teacherMissing.status, 404);
    // and the blocked students from earlier are ALL still intact
    for (const s of [sFee, sResult, sAtt, sUser]) {
      assert.ok(await Student.findById(s._id));
    }
  });
});
