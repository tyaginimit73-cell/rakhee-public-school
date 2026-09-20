import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer } from './helpers/testServer.js';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { Teacher } from '../models/Teacher.js';
import { Class } from '../models/Class.js';

// Covers the Phase 1 authorization-hardening pass (PROJECT_AUDIT.md):
//  - H1: teacher class-scoping on student create + field whitelist on update
//  - M5: Zod validation of user updates + last-active-admin protection
//  - L3: admin reset-password now enforces the same 8-char minimum as
//        user creation and self-service change-password

const asRole = async (baseUrl, email, password) => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.headers.getSetCookie()[0].split(';')[0];
};

const makeStudent = (cls, rollNumber, overrides = {}) => Student.create({
  firstName: 'Test', lastName: 'Student', gender: 'Male', dob: '2014-05-05', rollNumber,
  class: cls, fatherName: 'Father', motherName: 'Mother', phone: '9100000000',
  address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '250001' },
  admissionDate: '2024-04-01', ...overrides,
});

describe('teacher student-record authorization (H1)', () => {
  let baseUrl, teacherCookie, adminCookie;
  let ownClass, otherClass, ownStudent, otherStudent;

  before(async () => {
    baseUrl = await startTestServer();
    const teacherProfile = await Teacher.create({
      name: 'Mr Write Scope', designation: 'TGT', qualification: 'B.Ed', department: 'Mathematics',
    });
    ownClass = await Class.create({ name: 'Class 5', section: 'A', level: 'Primary', classTeacher: teacherProfile._id });
    otherClass = await Class.create({ name: 'Class 6', section: 'A', level: 'Primary' }); // nobody's class
    ownStudent = await makeStudent(ownClass._id, 'AH001');
    otherStudent = await makeStudent(otherClass._id, 'AH002');
    await User.create({ name: 'Teacher Scope', email: 'teacher-ah@test.local', password: 'CorrectHorse123', role: 'teacher', teacher: teacherProfile._id });
    await User.create({ name: 'Admin AH', email: 'admin-ah@test.local', password: 'CorrectHorse123', role: 'admin' });
    teacherCookie = await asRole(baseUrl, 'teacher-ah@test.local', 'CorrectHorse123');
    adminCookie = await asRole(baseUrl, 'admin-ah@test.local', 'CorrectHorse123');
  });
  after(async () => { await stopTestServer(); });

  const createBody = (classId, rollNumber) => ({
    firstName: 'New', lastName: 'Kid', gender: 'Female', dob: '2015-02-02', rollNumber,
    class: classId, fatherName: 'F', motherName: 'M', phone: '9200000000',
    address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '250001' },
  });

  test('teacher CANNOT create a student in a class they are not assigned to', async () => {
    const res = await fetch(`${baseUrl}/api/students`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
      body: JSON.stringify(createBody(String(otherClass._id), 'AH003')),
    });
    assert.equal(res.status, 403);
    assert.equal(await Student.countDocuments({ rollNumber: 'AH003' }), 0);
  });

  test('teacher CANNOT create a student without a valid class', async () => {
    const res = await fetch(`${baseUrl}/api/students`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
      body: JSON.stringify({ ...createBody(undefined, 'AH004'), class: undefined }),
    });
    assert.equal(res.status, 400);
  });

  test('teacher CAN create a student in their own assigned class (scope works, not a blanket ban)', async () => {
    const res = await fetch(`${baseUrl}/api/students`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
      body: JSON.stringify(createBody(String(ownClass._id), 'AH005')),
    });
    assert.equal(res.status, 201);
    const created = await Student.findOne({ rollNumber: 'AH005' });
    assert.equal(String(created.class), String(ownClass._id));
  });

  test('admin can still create a student in ANY class', async () => {
    const res = await fetch(`${baseUrl}/api/students`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify(createBody(String(otherClass._id), 'AH006')),
    });
    assert.equal(res.status, 201);
  });

  test('teacher CAN update permitted (contact/guardian) fields of a student in their class', async () => {
    const res = await fetch(`${baseUrl}/api/students/${ownStudent._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
      body: JSON.stringify({ phone: '9999999999', fatherName: 'Updated Father', address: { line1: 'New line', city: 'Meerut', district: 'Meerut', state: 'UP', pincode: '250001' } }),
    });
    assert.equal(res.status, 200);
    const fresh = await Student.findById(ownStudent._id);
    assert.equal(fresh.phone, '9999999999');
    assert.equal(fresh.fatherName, 'Updated Father');
    assert.equal(fresh.address.city, 'Meerut');
  });

  test('teacher CANNOT change class (authorization scope field)', async () => {
    const res = await fetch(`${baseUrl}/api/students/${ownStudent._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
      body: JSON.stringify({ class: String(otherClass._id) }),
    });
    assert.equal(res.status, 400);
    const fresh = await Student.findById(ownStudent._id);
    assert.equal(String(fresh.class), String(ownClass._id));
  });

  test('teacher CANNOT change rollNumber (results/fees lookup key)', async () => {
    const res = await fetch(`${baseUrl}/api/students/${ownStudent._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
      body: JSON.stringify({ rollNumber: 'HACKED1' }),
    });
    assert.equal(res.status, 400);
    const fresh = await Student.findById(ownStudent._id);
    assert.equal(fresh.rollNumber, 'AH001');
  });

  test('teacher CANNOT change dob (the public result-check secret)', async () => {
    const res = await fetch(`${baseUrl}/api/students/${ownStudent._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
      body: JSON.stringify({ dob: '2000-01-01' }),
    });
    assert.equal(res.status, 400);
    const fresh = await Student.findById(ownStudent._id);
    assert.equal(new Date(fresh.dob).toISOString().slice(0, 10), '2014-05-05');
  });

  test('teacher CANNOT change status (or any mix containing a locked field)', async () => {
    const res = await fetch(`${baseUrl}/api/students/${ownStudent._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
      body: JSON.stringify({ status: 'inactive', phone: '9888888888' }),
    });
    assert.equal(res.status, 400);
    const fresh = await Student.findById(ownStudent._id);
    assert.equal(fresh.status, 'active');
    assert.equal(fresh.phone, '9999999999'); // the permitted field in the same body must NOT have been applied either
  });

  test('teacher CANNOT update a student outside their assigned classes even with permitted fields', async () => {
    const res = await fetch(`${baseUrl}/api/students/${otherStudent._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
      body: JSON.stringify({ phone: '9777777777' }),
    });
    assert.equal(res.status, 403);
  });

  test('admin can still update security-sensitive student fields normally', async () => {
    const target = await makeStudent(otherClass._id, 'AH007');
    const res = await fetch(`${baseUrl}/api/students/${target._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ rollNumber: 'AH007R', dob: '2014-06-06', class: String(ownClass._id), status: 'active' }),
    });
    assert.equal(res.status, 200);
    const fresh = await Student.findById(target._id);
    assert.equal(fresh.rollNumber, 'AH007R');
    assert.equal(new Date(fresh.dob).toISOString().slice(0, 10), '2014-06-06');
    assert.equal(String(fresh.class), String(ownClass._id));
  });
});

describe('user update validation + reset-password strength (M5, L3)', () => {
  let baseUrl, adminCookie, classA, student1, targetUserEmail = 'target-ah@test.local';

  before(async () => {
    baseUrl = await startTestServer();
    classA = await Class.create({ name: 'Class 9', section: 'B', level: 'Secondary' });
    student1 = await makeStudent(classA._id, 'AH101');
    await User.create({ name: 'Admin M5', email: 'admin-m5@test.local', password: 'CorrectHorse123', role: 'admin' });
    await User.create({ name: 'Target User', email: targetUserEmail, password: 'CorrectHorse123', role: 'parent', students: [student1._id] });
    adminCookie = await asRole(baseUrl, 'admin-m5@test.local', 'CorrectHorse123');
  });
  after(async () => { await stopTestServer(); });

  const putUser = async (email, body) => {
    const target = await User.findOne({ email });
    return fetch(`${baseUrl}/api/users/${target._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify(body),
    });
  };

  test('invalid email format is rejected', async () => {
    const res = await putUser(targetUserEmail, { email: 'not-an-email' });
    assert.equal(res.status, 400);
    const fresh = await User.findOne({ email: targetUserEmail });
    assert.equal(fresh.email, targetUserEmail); // unchanged
  });

  test('invalid role is rejected', async () => {
    const res = await putUser(targetUserEmail, { role: 'superuser' });
    assert.equal(res.status, 400);
    const fresh = await User.findOne({ email: targetUserEmail });
    assert.equal(fresh.role, 'parent'); // unchanged
  });

  test('arbitrary/unknown fields are stripped, valid fields still apply', async () => {
    // Raw JSON string so the "__proto__" key survives as a real own property
    // of the parsed body (an object literal would silently set the prototype
    // instead). isActive is a real User field but NOT updatable via PUT.
    const target = await User.findOne({ email: targetUserEmail });
    const res = await fetch(`${baseUrl}/api/users/${target._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: '{"name":"Target Renamed","isActive":false,"someRandomField":"x","__proto__":{"hacked":true}}',
    });
    assert.equal(res.status, 200);
    const fresh = await User.findOne({ email: targetUserEmail }).select('+password');
    assert.equal(fresh.name, 'Target Renamed');  // the valid field applied
    assert.equal(fresh.isActive, true);          // unknown/non-updatable fields stripped
    assert.equal(fresh.someRandomField, undefined);
    assert.equal(({}).hacked, undefined);        // no prototype pollution leaked anywhere
  });

  test('valid update (email + phone) still works exactly as before', async () => {
    const res = await putUser(targetUserEmail, { email: 'target-new@test.local', phone: '9111111111' });
    assert.equal(res.status, 200);
    const fresh = await User.findOne({ email: 'target-new@test.local' });
    assert.ok(fresh);
    assert.equal(fresh.phone, '9111111111');
    targetUserEmail = 'target-new@test.local';
  });

  test('student-link rules still work: empty array clears the link', async () => {
    const res = await putUser(targetUserEmail, { students: [] });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.effectiveStudents.length, 0);
  });

  test('student-link rules still work: malformed student id is rejected by the controller', async () => {
    const res = await putUser(targetUserEmail, { students: ['abc'] });
    assert.equal(res.status, 400);
  });

  test('reset password SHORTER than 8 characters is rejected', async () => {
    const target = await User.findOne({ email: targetUserEmail });
    const res = await fetch(`${baseUrl}/api/users/${target._id}/password`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ newPassword: 'Short1!' }), // 7 chars
    });
    assert.equal(res.status, 400);
    // old password must still work — the reset did not happen
    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetUserEmail, password: 'CorrectHorse123' }),
    });
    assert.equal(login.status, 200);
  });

  test('valid reset password (8+ chars) still works and is never echoed back', async () => {
    const target = await User.findOne({ email: targetUserEmail });
    const newPassword = 'BrandNewPass456';
    const res = await fetch(`${baseUrl}/api/users/${target._id}/password`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ newPassword }),
    });
    assert.equal(res.status, 200);
    const bodyText = await res.text();
    assert.ok(!bodyText.includes(newPassword), 'response must not echo the password');
    // and the user can now log in with the new password (and not the old one)
    const okLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetUserEmail, password: newPassword }),
    });
    assert.equal(okLogin.status, 200);
    const oldLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetUserEmail, password: 'CorrectHorse123' }),
    });
    assert.equal(oldLogin.status, 401);
  });
});

describe('last active admin protection (M5)', () => {
  let baseUrl, adminA, adminB, cookieA;
  const EMAIL_A = 'admin-a@test.local';
  const EMAIL_B = 'admin-b@test.local';

  before(async () => {
    baseUrl = await startTestServer();
    adminA = await User.create({ name: 'Admin A', email: EMAIL_A, password: 'CorrectHorse123', role: 'admin' });
    adminB = await User.create({ name: 'Admin B', email: EMAIL_B, password: 'CorrectHorse123', role: 'admin' });
    cookieA = await asRole(baseUrl, EMAIL_A, 'CorrectHorse123');
  });
  after(async () => { await stopTestServer(); });

  test('with another active admin present, demoting an admin works normally', async () => {
    const res = await fetch(`${baseUrl}/api/users/${adminB._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ role: 'parent' }),
    });
    assert.equal(res.status, 200);
    // restore for the following tests
    const restore = await fetch(`${baseUrl}/api/users/${adminB._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ role: 'admin' }),
    });
    assert.equal(restore.status, 200);
  });

  test('with another active admin present, deleting an admin works normally', async () => {
    const res = await fetch(`${baseUrl}/api/users/${adminB._id}`, {
      method: 'DELETE', headers: { Cookie: cookieA },
    });
    assert.equal(res.status, 200);
    assert.equal(await User.countDocuments({ role: 'admin' }), 1); // only Admin A remains
  });

  // From here on Admin A is the LAST active admin — every removal path must be blocked.

  test('the last active admin cannot DELETE their own account', async () => {
    const res = await fetch(`${baseUrl}/api/users/${adminA._id}`, {
      method: 'DELETE', headers: { Cookie: cookieA },
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /last active admin/i);
    assert.ok(await User.findById(adminA._id), 'account must still exist');
  });

  test('the last active admin cannot be DEACTIVATED (toggle)', async () => {
    const res = await fetch(`${baseUrl}/api/users/${adminA._id}/toggle`, {
      method: 'PATCH', headers: { Cookie: cookieA },
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /last active admin/i);
    const fresh = await User.findById(adminA._id);
    assert.equal(fresh.isActive, true);
  });

  test('the last active admin cannot be DEMOTED (role change)', async () => {
    const res = await fetch(`${baseUrl}/api/users/${adminA._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ role: 'teacher' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /last active admin/i);
    const fresh = await User.findById(adminA._id);
    assert.equal(fresh.role, 'admin');
  });

  test('once another active admin exists again, normal management resumes', async () => {
    // create a second admin
    const create = await fetch(`${baseUrl}/api/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ name: 'Admin C', email: 'admin-c@test.local', password: 'CorrectHorse123', role: 'admin' }),
    });
    assert.equal(create.status, 201);
    const adminC = await User.findOne({ email: 'admin-c@test.local' });

    // deactivate works (Admin A still remains)
    const off = await fetch(`${baseUrl}/api/users/${adminC._id}/toggle`, { method: 'PATCH', headers: { Cookie: cookieA } });
    assert.equal(off.status, 200);
    // re-activate works
    const on = await fetch(`${baseUrl}/api/users/${adminC._id}/toggle`, { method: 'PATCH', headers: { Cookie: cookieA } });
    assert.equal(on.status, 200);
    // delete works (Admin A still remains)
    const del = await fetch(`${baseUrl}/api/users/${adminC._id}`, { method: 'DELETE', headers: { Cookie: cookieA } });
    assert.equal(del.status, 200);
  });
});
