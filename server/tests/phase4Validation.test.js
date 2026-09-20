import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer } from './helpers/testServer.js';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { Teacher } from '../models/Teacher.js';
import { Class } from '../models/Class.js';
import { Fee } from '../models/Fee.js';
import { Notice } from '../models/Notice.js';
import { GalleryImage } from '../models/GalleryImage.js';
import { Admission } from '../models/Admission.js';

// Phase 4A — HTTP-level regression tests for admin CRUD request validation
// and query-filter hardening. Requires a mongod binary (mongodb-memory-
// server), like every other integration suite in this folder; see TESTS.md
// for the sandbox download limitation.

const OID = '665f1c2a9b3e4d5a6b7c8d9e';

const login = async (baseUrl, email, password) => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, cookie: res.headers.getSetCookie()?.[0]?.split(';')[0], token: body?.data?.token, body };
};

describe('Phase 4A — admin CRUD validation over HTTP', () => {
  let baseUrl, adminCookie, teacherCookie, teacherId, otherTeacherId, classA, student;

  before(async () => {
    baseUrl = await startTestServer();

    const t1 = await Teacher.create({ name: 'Linked Teacher', designation: 'TGT', qualification: 'B.Ed.', department: 'Phase4Dept' });
    const t2 = await Teacher.create({ name: 'Reference Teacher', designation: 'PGT', qualification: 'M.Sc.', department: 'Phase4Dept' });
    teacherId = t1._id; otherTeacherId = t2._id;
    classA = await Class.create({ name: 'Class P4', section: 'A', level: 'Primary', classTeacher: t1._id });
    student = await Student.create({
      firstName: 'Phase', lastName: 'Four', gender: 'Male', dob: '2013-05-05', rollNumber: 'P4A001',
      class: classA._id, fatherName: 'F', motherName: 'M', phone: '9400000001',
      address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '250001' },
    });
    await User.create({ name: 'Admin P4', email: 'admin-p4@test.local', password: 'CorrectHorse123', role: 'admin' });
    await User.create({ name: 'Teacher P4', email: 'teacher-p4@test.local', password: 'CorrectHorse123', role: 'teacher', teacher: t1._id });
    adminCookie = (await login(baseUrl, 'admin-p4@test.local', 'CorrectHorse123')).cookie;
    teacherCookie = (await login(baseUrl, 'teacher-p4@test.local', 'CorrectHorse123')).cookie;
  });
  after(async () => { await stopTestServer(); });

  const asAdmin = (path, method = 'GET', body) => fetch(`${baseUrl}${path}`, {
    method, headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // ---------- Students ----------

  test('students: valid create is accepted and persisted', async () => {
    const res = await asAdmin('/api/students', 'POST', {
      firstName: 'Valid', lastName: 'Create', gender: 'Female', dob: '2014-01-02',
      rollNumber: 'P4A002', class: String(classA._id), fatherName: 'F', motherName: 'M',
      phone: '9400000002', email: '', address: { line1: 'a', city: 'b', district: 'c', state: 'd', pincode: '250001' },
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.firstName, 'Valid');
  });

  test('students: invalid email / invalid dob / invalid class ObjectId are each rejected', async () => {
    const base = {
      firstName: 'Bad', gender: 'Male', dob: '2014-01-02', rollNumber: 'P4A003',
      class: String(classA._id), fatherName: 'F', motherName: 'M', phone: '9400000003',
    };
    assert.equal((await asAdmin('/api/students', 'POST', { ...base, email: 'not-an-email' })).status, 400);
    assert.equal((await asAdmin('/api/students', 'POST', { ...base, dob: 'yesterday' })).status, 400);
    assert.equal((await asAdmin('/api/students', 'POST', { ...base, class: 'nope' })).status, 400);
    assert.equal((await asAdmin('/api/students', 'POST', { ...base, gender: 'Alien' })).status, 400);
  });

  test('students: unknown/mass-assignment fields are stripped before the model', async () => {
    const res = await asAdmin('/api/students', 'POST', {
      firstName: 'Strip', lastName: 'Check', gender: 'Male', dob: '2014-03-04', rollNumber: 'P4A004',
      class: String(classA._id), fatherName: 'F', motherName: 'M', phone: '9400000004',
      password: 'evil', role: 'admin', bloodGroup: 'O+', createdAt: '1970-01-01',
    });
    assert.equal(res.status, 201);
    const doc = await Student.findById(res.body?.data?._id || (await res.json()).data._id);
    assert.equal(doc.bloodGroup, 'O+'); // a REAL model field survives
    assert.equal(Object.prototype.hasOwnProperty.call(doc.toObject(), 'password'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(doc.toObject(), 'role'), false);
  });

  test('students: admin PUT tolerates the frontend doc-spread extras and still updates', async () => {
    const res = await asAdmin(`/api/students/${student._id}`, 'PUT', {
      firstName: 'Phase', lastName: 'FourUpdated', _id: String(student._id),
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z', __v: 0,
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.lastName, 'FourUpdated');
  });

  test('students: Phase 1 teacher restrictions remain exactly enforced', async () => {
    // Whitelisted field — allowed for a teacher assigned to the class.
    const ok = await fetch(`${baseUrl}/api/students/${student._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
      body: JSON.stringify({ phone: '9400009999' }),
    });
    assert.equal(ok.status, 200);

    // Security-sensitive field — rejected outright (not silently stripped).
    const blocked = await fetch(`${baseUrl}/api/students/${student._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
      body: JSON.stringify({ rollNumber: 'HACKED1' }),
    });
    assert.equal(blocked.status, 400);
    const body = await blocked.json();
    assert.match(body.message, /Teachers cannot modify/i);

    // Class field (scope move) also still rejected even though it is a schema field.
    const scopeMove = await fetch(`${baseUrl}/api/students/${student._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
      body: JSON.stringify({ class: String(classA._id) }),
    });
    assert.equal(scopeMove.status, 400);
  });

  // ---------- Teachers ----------

  test('teachers: valid create and update', async () => {
    const created = await asAdmin('/api/teachers', 'POST', {
      name: 'New Faculty', designation: 'PRT', qualification: 'B.Ed.', department: 'Phase4Dept',
      subjects: ['English'], experienceYears: '3', email: 'nf@test.local', phone: '9400000005', bio: '',
    });
    assert.equal(created.status, 201);
    const id = (await created.json()).data._id;
    const updated = await asAdmin(`/api/teachers/${id}`, 'PUT', { bio: 'Updated bio', experienceYears: 4 });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).data.bio, 'Updated bio');
  });

  test('teachers: missing name / negative experience rejected', async () => {
    assert.equal((await asAdmin('/api/teachers', 'POST', { designation: 'PRT', qualification: 'B.Ed.', department: 'D' })).status, 400);
    assert.equal((await asAdmin('/api/teachers', 'POST', { name: 'X Y', designation: 'PRT', qualification: 'B.Ed.', department: 'D', experienceYears: -1 })).status, 400);
  });

  // ---------- Classes ----------

  test('classes: valid create WITHOUT a teacher still works', async () => {
    const res = await asAdmin('/api/classes', 'POST', { name: 'Class P4B', section: 'B', level: 'Primary', subjects: [], classTeacher: null, capacity: 40 });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.classTeacher, null);
  });

  test('classes: valid create WITH an existing teacher', async () => {
    const res = await asAdmin('/api/classes', 'POST', { name: 'Class P4C', section: 'C', classTeacher: String(otherTeacherId) });
    assert.equal(res.status, 201);
    assert.equal((await res.json()).data.classTeacher, String(otherTeacherId));
  });

  test('classes: malformed classTeacher format rejected', async () => {
    const res = await asAdmin('/api/classes', 'POST', { name: 'Class P4D', section: 'D', classTeacher: 'not-an-id' });
    assert.equal(res.status, 400);
  });

  test('classes: nonexistent classTeacher rejected (no dangling refs)', async () => {
    const res = await asAdmin('/api/classes', 'POST', { name: 'Class P4E', section: 'E', classTeacher: OID });
    assert.equal(res.status, 404);
    assert.match((await res.json()).message, /Teacher not found/i);
  });

  test('classes: update with nonexistent classTeacher rejected; without classTeacher key unaffected', async () => {
    const bad = await asAdmin(`/api/classes/${classA._id}`, 'PUT', { classTeacher: OID });
    assert.equal(bad.status, 404);
    const fine = await asAdmin(`/api/classes/${classA._id}`, 'PUT', { section: 'A' });
    assert.equal(fine.status, 200);
  });

  // ---------- Fees ----------

  const feeBody = (overrides = {}) => ({ rollNumber: 'P4A001', title: 'Tuition P4', session: '2026-27', totalAmount: 1000, note: '', ...overrides });

  test('fees: valid create accepts a numeric-string amount (frontend behavior)', async () => {
    const res = await asAdmin('/api/fees', 'POST', feeBody({ rollNumber: 'P4A001', totalAmount: '1200', dueDate: '2026-12-01' }));
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.totalAmount, 1200);
    assert.equal(body.data.status, 'Pending');
  });

  test('fees: empty dueDate still means "no due date" (stored as null)', async () => {
    const res = await asAdmin('/api/fees', 'POST', feeBody({ rollNumber: 'P4A002', totalAmount: 500, dueDate: '' }));
    assert.equal(res.status, 201);
    assert.equal((await res.json()).data.dueDate, null);
  });

  test('fees: zero, negative, NaN-producing, and Infinity amounts are all rejected', async () => {
    assert.equal((await asAdmin('/api/fees', 'POST', feeBody({ totalAmount: 0 }))).status, 400);
    assert.equal((await asAdmin('/api/fees', 'POST', feeBody({ totalAmount: -50 }))).status, 400);
    assert.equal((await asAdmin('/api/fees', 'POST', feeBody({ totalAmount: 'abc' }))).status, 400);
    assert.equal((await asAdmin('/api/fees', 'POST', feeBody({ totalAmount: null }))).status, 400);
  });

  test('fees: malformed dueDate rejected', async () => {
    assert.equal((await asAdmin('/api/fees', 'POST', feeBody({ dueDate: 'whenever' }))).status, 400);
  });

  test('fees: Phase 2 atomic addPayment still works untouched', async () => {
    const created = await asAdmin('/api/fees', 'POST', feeBody({ rollNumber: 'P4A004', totalAmount: 800 }));
    const feeId = (await created.json()).data._id;
    const pay = await asAdmin(`/api/fees/${feeId}/payments`, 'POST', { amount: 300, method: 'UPI', note: 'part' });
    assert.equal(pay.status, 200);
    const body = await pay.json();
    assert.equal(body.data.fee.paidAmount, 300);
    assert.equal(body.data.fee.status, 'Partial');
    const overpay = await asAdmin(`/api/fees/${feeId}/payments`, 'POST', { amount: 900, method: 'Cash' });
    assert.equal(overpay.status, 400);
  });

  // ---------- Notices / Events / Gallery / Testimonials ----------

  test('notices: valid create (string booleans coerce as before); bad category rejected', async () => {
    const ok = await asAdmin('/api/notices', 'POST', { title: 'P4 Notice', description: 'Details here', category: 'Academic', isImportant: 'true', isPublished: 'true' });
    assert.equal(ok.status, 201);
    const body = await ok.json();
    assert.equal(body.data.isImportant, true);
    assert.equal((await asAdmin('/api/notices', 'POST', { title: 'Bad', description: 'Body', category: 'Invented' })).status, 400);
  });

  test('notices: multipart form submission still works end to end', async () => {
    const fd = new FormData();
    fd.append('title', 'Multipart Notice');
    fd.append('description', 'Submitted exactly like the admin UI does.');
    fd.append('category', 'General');
    fd.append('isImportant', 'false');
    fd.append('isPublished', 'true');
    const res = await fetch(`${baseUrl}/api/notices`, { method: 'POST', headers: { Cookie: adminCookie }, body: fd });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.title, 'Multipart Notice');
    assert.equal(body.data.isPublished, true);
  });

  test('events: valid create accepted; malformed date rejected', async () => {
    const ok = await asAdmin('/api/events', 'POST', { title: 'P4 Event', description: 'Fun day', date: '2026-11-14', time: '10:00', location: 'Ground', category: 'Cultural', registrationRequired: 'false', isPublished: 'true' });
    assert.equal(ok.status, 201);
    assert.equal((await asAdmin('/api/events', 'POST', { title: 'Bad Event', description: 'x', date: 'not-a-date' })).status, 400);
  });

  test('gallery: order kept when valid, defaulted when absent, rejected when malformed', async () => {
    const withOrder = await asAdmin('/api/gallery', 'POST', { title: 'Ordered', category: 'Campus', imagePath: '/uploads/phase4.jpg', order: '2' });
    assert.equal(withOrder.status, 201);
    assert.equal((await withOrder.json()).data.order, 2);

    const noOrder = await asAdmin('/api/gallery', 'POST', { title: 'Default Order', category: 'Campus', imagePath: '/uploads/phase4b.jpg' });
    assert.equal(noOrder.status, 201);
    assert.equal((await noOrder.json()).data.order, 0);

    const badOrder = await asAdmin('/api/gallery', 'POST', { title: 'Bad Order', category: 'Campus', imagePath: '/uploads/phase4c.jpg', order: 'junk' });
    assert.equal(badOrder.status, 400);
  });

  test('testimonials: valid create accepted; rating out of range rejected', async () => {
    const ok = await asAdmin('/api/testimonials', 'POST', { name: 'Phase Parent', message: 'Wonderful experience for us.', rating: '5', isPublished: true });
    assert.equal(ok.status, 201);
    assert.equal((await asAdmin('/api/testimonials', 'POST', { name: 'Phase Parent', message: 'Wonderful experience.', rating: 7 })).status, 400);
  });

  // ---------- Query-filter hardening ----------

  test('query filters: operator-style values are ignored, not applied (admin endpoints)', async () => {
    // users: if $ne reached Mongo, admins would disappear from the result.
    const injected = await (await asAdmin('/api/users?role[$ne]=student')).json();
    assert.ok(injected.data.items.some((u) => u.role === 'admin'), 'operator was applied — admins filtered out!');
    // Normal filtering still works.
    const normal = await (await asAdmin('/api/users?role=admin')).json();
    assert.ok(normal.data.items.every((u) => u.role === 'admin'));

    // students: injected status must behave exactly like no filter.
    const noFilter = await (await asAdmin('/api/students')).json();
    const operator = await (await asAdmin('/api/students?status[$in]=active,alumni')).json();
    assert.equal(operator.data.total, noFilter.data.total);
    // And a plain scalar still filters.
    const alumni = await (await asAdmin('/api/students?status=alumni')).json();
    assert.equal(alumni.data.items.length, 0);

    // fees / admissions: same ignore-behavior.
    const feesAll = await (await asAdmin('/api/fees')).json();
    const feesOp = await (await asAdmin('/api/fees?status[$ne]=Paid')).json();
    assert.equal(feesOp.data.total, feesAll.data.total);
    const admAll = await (await asAdmin('/api/admissions')).json();
    const admOp = await (await asAdmin('/api/admissions?status[$regex]=.*')).json();
    assert.equal(admOp.data.total, admAll.data.total);
  });

  test('query filters: operator-style values are ignored on PUBLIC endpoints without weakening them', async () => {
    await Notice.create({ title: 'P4 Public Notice', description: 'visible', category: 'General', isPublished: true });
    await Notice.create({ title: 'P4 Hidden Notice', description: 'hidden', category: 'General', isPublished: false });
    const all = await (await fetch(`${baseUrl}/api/notices`)).json();
    const injected = await (await fetch(`${baseUrl}/api/notices?category[$ne]=General`)).json();
    assert.equal(injected.data.total, all.data.total, 'operator was applied on the public notice list');
    assert.ok(injected.data.items.every((n) => n.isPublished === true), 'public isPublished predicate weakened');

    const teachersAll = await (await fetch(`${baseUrl}/api/teachers`)).json();
    const teachersOp = await (await fetch(`${baseUrl}/api/teachers?department[$regex]=.*`)).json();
    assert.equal(teachersOp.data.items.length, teachersAll.data.items.length);
    assert.ok(teachersOp.data.items.every((t) => t.isActive === true), 'public isActive predicate weakened');

    const galleryAll = await (await fetch(`${baseUrl}/api/gallery`)).json();
    const galleryOp = await (await fetch(`${baseUrl}/api/gallery?category[$in]=Campus,Sports`)).json();
    assert.equal(galleryOp.data.items.length, galleryAll.data.items.length);
  });

  test('query filters: global search survives operator-style q (no 500)', async () => {
    const res = await asAdmin('/api/search?q[$ne]=x');
    assert.equal(res.status, 200);
    const res2 = await asAdmin('/api/search?q=Phase');
    assert.equal(res2.status, 200);
  });
});
