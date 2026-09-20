import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer } from './helpers/testServer.js';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { Class } from '../models/Class.js';
import mongoose from 'mongoose';

const loginAndGetCookie = async (baseUrl, email, password) => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  const cookie = res.headers.getSetCookie()[0].split(';')[0];
  return { cookie, body };
};

describe('user management — parent child-link update / removal and validation', () => {
  let baseUrl, adminCookie, parentCookie;
  let classA, student1, student2;

  before(async () => {
    baseUrl = await startTestServer();
    classA = await Class.create({ name: 'Class 10', section: 'A', level: 'Secondary' });
    student1 = await Student.create({
      firstName: 'Child', lastName: 'One', gender: 'Male', dob: '2015-01-01', rollNumber: 'UM001',
      class: classA._id, fatherName: 'F', motherName: 'M', phone: '9000000001',
      address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '123456' }, admissionDate: '2024-01-01'
    });
    student2 = await Student.create({
      firstName: 'Child', lastName: 'Two', gender: 'Female', dob: '2016-01-01', rollNumber: 'UM002',
      class: classA._id, fatherName: 'F', motherName: 'M', phone: '9000000002',
      address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '123456' }, admissionDate: '2024-01-01'
    });

    await User.create({ name: 'Admin', email: 'admin-um@test.local', password: 'CorrectHorse123', role: 'admin' });
    const adminLogin = await loginAndGetCookie(baseUrl, 'admin-um@test.local', 'CorrectHorse123');
    adminCookie = adminLogin.cookie;
  });

  after(async () => { await stopTestServer(); });

  test('admin creates parent linked to student', async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Parent One', email: 'parent-um1@test.local', password: 'CorrectHorse123',
        role: 'parent', students: [String(student1._id)]
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.data.effectiveStudents.length === 1);
    assert.equal(body.data.effectiveStudents[0]._id, String(student1._id));
  });

  test('admin creates student account linked to own record', async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Student One', email: 'student-um1@test.local', password: 'CorrectHorse123',
        role: 'student', students: [String(student1._id)]
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.role, 'student');
    assert.ok(body.data.effectiveStudents.length === 1);
  });

  test('admin changes student link', async () => {
    const parent = await User.findOne({ email: 'parent-um1@test.local' });
    const res = await fetch(`${baseUrl}/api/users/${parent._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ students: [String(student2._id)] }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.effectiveStudents.length, 1);
    assert.equal(body.data.effectiveStudents[0]._id, String(student2._id));
  });

  test('admin removes student link via empty array', async () => {
    const parent = await User.findOne({ email: 'parent-um1@test.local' });
    const res = await fetch(`${baseUrl}/api/users/${parent._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ students: [] }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    // effectiveStudents should be empty after removal
    assert.equal(body.data.effectiveStudents.length, 0);
    // Verify DB also cleared legacy field
    const fresh = await User.findById(parent._id);
    assert.equal(fresh.students.length, 0);
    assert.ok(!fresh.student);
  });

  test('admin removes student link via null', async () => {
    // Re-link first
    const parent = await User.findOne({ email: 'parent-um1@test.local' });
    await User.findByIdAndUpdate(parent._id, { students: [student1._id], student: null });
    const res = await fetch(`${baseUrl}/api/users/${parent._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ students: null }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.effectiveStudents.length, 0);
  });

  test('invalid student ID rejected (malformed)', async () => {
    const parent = await User.findOne({ email: 'parent-um1@test.local' });
    const res = await fetch(`${baseUrl}/api/users/${parent._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ students: ['abc'] }),
    });
    assert.equal(res.status, 400);
  });

  test('invalid student ID rejected (not-an-object-id string)', async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Bad Parent', email: 'bad-parent@test.local', password: 'CorrectHorse123',
        role: 'parent', students: ['not-an-object-id']
      }),
    });
    assert.equal(res.status, 400);
  });

  test('nonexistent student ID rejected', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Ghost Parent', email: 'ghost-parent@test.local', password: 'CorrectHorse123',
        role: 'parent', students: [String(fakeId)]
      }),
    });
    assert.equal(res.status, 404);
  });

  test('unauthorized attempt — parent cannot modify users', async () => {
    await User.create({ name: 'Parent Two', email: 'parent-um2@test.local', password: 'CorrectHorse123', role: 'parent', students: [student1._id] });
    const { cookie } = await loginAndGetCookie(baseUrl, 'parent-um2@test.local', 'CorrectHorse123');
    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'GET',
      headers: { Cookie: cookie },
    });
    assert.equal(res.status, 403);
  });

  test('unauthorized attempt — student cannot create user', async () => {
    const { cookie } = await loginAndGetCookie(baseUrl, 'student-um1@test.local', 'CorrectHorse123');
    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        name: 'Hacker', email: 'hacker@test.local', password: 'CorrectHorse123', role: 'admin'
      }),
    });
    assert.equal(res.status, 403);
  });

  test('student account cannot be linked to multiple students', async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Student Multi', email: 'student-multi@test.local', password: 'CorrectHorse123',
        role: 'student', students: [String(student1._id), String(student2._id)]
      }),
    });
    assert.equal(res.status, 400);
  });

  test('admin cannot assign student link to admin role', async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Admin With Student', email: 'admin-student@test.local', password: 'CorrectHorse123',
        role: 'admin', students: [String(student1._id)]
      }),
    });
    // Should either reject or ignore student link — our implementation forces clear and rejects if provided
    // For admin role, if students provided, it should be rejected as per validation
    assert.ok([201, 400].includes(res.status));
    if (res.status === 201) {
      const body = await res.json();
      assert.equal(body.data.effectiveStudents.length, 0);
    }
  });

  test('legacy student field removal works', async () => {
    // Create user with legacy field directly via model to simulate old account
    const legacyUser = await User.create({
      name: 'Legacy Parent', email: 'legacy-parent@test.local', password: 'CorrectHorse123',
      role: 'parent', student: student1._id
    });
    // Admin removes via empty students array — should clear both
    const res = await fetch(`${baseUrl}/api/users/${legacyUser._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ students: [] }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.effectiveStudents.length, 0);
    const fresh = await User.findById(legacyUser._id);
    assert.equal(fresh.students.length, 0);
    assert.ok(!fresh.student);
  });
});

describe('invalid ObjectId handling does not produce 500', () => {
  let baseUrl, adminCookie, classA, student1;

  before(async () => {
    baseUrl = await startTestServer();
    classA = await Class.create({ name: 'Class Invalid', section: 'A', level: 'Primary' });
    student1 = await Student.create({
      firstName: 'Test', lastName: 'Student', gender: 'Male', dob: '2015-01-01', rollNumber: 'INV001',
      class: classA._id, fatherName: 'F', motherName: 'M', phone: '9000000001',
      address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '123456' }, admissionDate: '2024-01-01'
    });
    await User.create({ name: 'Admin Invalid', email: 'admin-invalid@test.local', password: 'CorrectHorse123', role: 'admin' });
    await User.create({ name: 'Parent Invalid', email: 'parent-invalid@test.local', password: 'CorrectHorse123', role: 'parent', students: [student1._id] });
    const adminLogin = await loginAndGetCookie(baseUrl, 'admin-invalid@test.local', 'CorrectHorse123');
    adminCookie = adminLogin.cookie;
  });
  after(async () => { await stopTestServer(); });

  test('GET /api/students/abc returns 400 not 500', async () => {
    const res = await fetch(`${baseUrl}/api/students/abc`, { headers: { Cookie: adminCookie } });
    assert.ok([400, 404].includes(res.status));
    assert.notEqual(res.status, 500);
  });

  test('GET /api/parent/children/abc returns 400 not 500', async () => {
    const { cookie } = await loginAndGetCookie(baseUrl, 'parent-invalid@test.local', 'CorrectHorse123');
    const res = await fetch(`${baseUrl}/api/parent/children/abc`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 400);
  });

  test('GET /api/teacher/classes/abc/students returns 400 not 500', async () => {
    // Create teacher
    const { Teacher } = await import('../models/Teacher.js');
    const teacherProfile = await Teacher.create({ name: 'T Invalid', designation: 'PGT', qualification: 'M.Ed', department: 'Science' });
    await User.create({ name: 'Teacher Invalid', email: 'teacher-invalid@test.local', password: 'CorrectHorse123', role: 'teacher', teacher: teacherProfile._id });
    const { cookie } = await loginAndGetCookie(baseUrl, 'teacher-invalid@test.local', 'CorrectHorse123');
    const res = await fetch(`${baseUrl}/api/teacher/classes/abc/students`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 400);
  });

  test('GET /api/attendance/roster?classId=abc returns 400 not 500', async () => {
    const res = await fetch(`${baseUrl}/api/attendance/roster?classId=abc&date=2026-01-01`, { headers: { Cookie: adminCookie } });
    assert.equal(res.status, 400);
  });
});

describe('legacy portal endpoint cannot bypass role restrictions', () => {
  let baseUrl, teacherCookie, parentCookie, studentCookie;

  before(async () => {
    baseUrl = await startTestServer();
    const { Teacher } = await import('../models/Teacher.js');
    const classA = await Class.create({ name: 'Class Legacy', section: 'A', level: 'Primary' });
    const student = await Student.create({
      firstName: 'Legacy', lastName: 'Student', gender: 'Male', dob: '2015-01-01', rollNumber: 'LEG001',
      class: classA._id, fatherName: 'F', motherName: 'M', phone: '9000000001',
      address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '123456' }, admissionDate: '2024-01-01'
    });
    const teacherProfile = await Teacher.create({ name: 'Legacy Teacher', designation: 'PGT', qualification: 'M.Ed', department: 'Science' });
    await User.create({ name: 'Admin Legacy', email: 'admin-legacy@test.local', password: 'CorrectHorse123', role: 'admin' });
    await User.create({ name: 'Teacher Legacy', email: 'teacher-legacy@test.local', password: 'CorrectHorse123', role: 'teacher', teacher: teacherProfile._id });
    await User.create({ name: 'Parent Legacy', email: 'parent-legacy@test.local', password: 'CorrectHorse123', role: 'parent', students: [student._id] });
    await User.create({ name: 'Student Legacy', email: 'student-legacy@test.local', password: 'CorrectHorse123', role: 'student', students: [student._id] });

    teacherCookie = (await loginAndGetCookie(baseUrl, 'teacher-legacy@test.local', 'CorrectHorse123')).cookie;
    parentCookie = (await loginAndGetCookie(baseUrl, 'parent-legacy@test.local', 'CorrectHorse123')).cookie;
    studentCookie = (await loginAndGetCookie(baseUrl, 'student-legacy@test.local', 'CorrectHorse123')).cookie;
  });
  after(async () => { await stopTestServer(); });

  test('teacher cannot access legacy /api/portal/overview (should be 403)', async () => {
    const res = await fetch(`${baseUrl}/api/portal/overview`, { headers: { Cookie: teacherCookie } });
    assert.equal(res.status, 403);
  });

  test('parent CAN access legacy /api/portal/overview', async () => {
    const res = await fetch(`${baseUrl}/api/portal/overview`, { headers: { Cookie: parentCookie } });
    assert.equal(res.status, 200);
  });

  test('student CAN access legacy /api/portal/overview', async () => {
    const res = await fetch(`${baseUrl}/api/portal/overview`, { headers: { Cookie: studentCookie } });
    assert.equal(res.status, 200);
  });

  test('unauthenticated cannot access legacy portal', async () => {
    const res = await fetch(`${baseUrl}/api/portal/overview`);
    assert.equal(res.status, 401);
  });
});
