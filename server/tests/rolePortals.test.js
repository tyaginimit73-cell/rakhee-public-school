import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer } from './helpers/testServer.js';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { Teacher } from '../models/Teacher.js';
import { Class } from '../models/Class.js';

const asRole = async (baseUrl, email, password) => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.headers.getSetCookie()[0].split(';')[0];
};

describe('parent portal — multi-child support and cross-family IDOR prevention', () => {
  let baseUrl, familyACookie, familyBCookie, childA1, childA2, childB1;

  before(async () => {
    baseUrl = await startTestServer();
    const cls = await Class.create({ name: 'Class 1', section: 'A', level: 'Primary' });
    childA1 = await Student.create({ firstName: 'A1', lastName: 'Family', gender: 'Male', dob: '2015-01-01', rollNumber: 'R001', class: cls._id, fatherName: 'F', motherName: 'M', phone: '9000000001', address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '123456' }, admissionDate: '2024-01-01' });
    childA2 = await Student.create({ firstName: 'A2', lastName: 'Family', gender: 'Female', dob: '2016-01-01', rollNumber: 'R002', class: cls._id, fatherName: 'F', motherName: 'M', phone: '9000000001', address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '123456' }, admissionDate: '2024-01-01' });
    childB1 = await Student.create({ firstName: 'B1', lastName: 'Other', gender: 'Male', dob: '2015-01-01', rollNumber: 'R003', class: cls._id, fatherName: 'F', motherName: 'M', phone: '9000000002', address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '123456' }, admissionDate: '2024-01-01' });

    // Family A: uses the NEW students[] array with two children.
    await User.create({ name: 'Parent A', email: 'parentA@test.local', password: 'CorrectHorse123', role: 'parent', students: [childA1._id, childA2._id] });
    // Family B: deliberately uses ONLY the LEGACY single `student` field,
    // simulating a pre-existing account that predates this migration —
    // this is the actual backward-compatibility guarantee under test.
    await User.create({ name: 'Parent B', email: 'parentB@test.local', password: 'CorrectHorse123', role: 'parent', student: childB1._id });

    familyACookie = await asRole(baseUrl, 'parentA@test.local', 'CorrectHorse123');
    familyBCookie = await asRole(baseUrl, 'parentB@test.local', 'CorrectHorse123');
  });
  after(async () => { await stopTestServer(); });

  test('a legacy single-child account (no students[] array at all) still works, unmigrated', async () => {
    const res = await fetch(`${baseUrl}/api/parent/children`, { headers: { Cookie: familyBCookie } });
    const body = await res.json();
    assert.equal(body.data.children.length, 1);
    assert.equal(body.data.children[0]._id, String(childB1._id));
  });

  test('a multi-child account (new students[] array) lists every child', async () => {
    const res = await fetch(`${baseUrl}/api/parent/children`, { headers: { Cookie: familyACookie } });
    const body = await res.json();
    assert.equal(body.data.children.length, 2);
    const ids = body.data.children.map((c) => c._id).sort();
    assert.deepEqual(ids, [String(childA1._id), String(childA2._id)].sort());
  });

  test('a parent CAN access each of their own children\'s overview', async () => {
    for (const child of [childA1, childA2]) {
      const res = await fetch(`${baseUrl}/api/parent/children/${child._id}`, { headers: { Cookie: familyACookie } });
      assert.equal(res.status, 200);
    }
  });

  test('THE CORE IDOR CHECK: a parent cannot access another family\'s child by editing the id in the request', async () => {
    const res = await fetch(`${baseUrl}/api/parent/children/${childB1._id}`, { headers: { Cookie: familyACookie } });
    assert.equal(res.status, 403);
  });

  test('and the reverse: the legacy single-child family cannot reach family A\'s children either', async () => {
    const res = await fetch(`${baseUrl}/api/parent/children/${childA1._id}`, { headers: { Cookie: familyBCookie } });
    assert.equal(res.status, 403);
  });

  test('a parent hitting the parent API without authentication at all is rejected', async () => {
    const res = await fetch(`${baseUrl}/api/parent/children`);
    assert.equal(res.status, 401);
  });
});

describe('student portal — no id in the request at all', () => {
  let baseUrl;
  before(async () => {
    baseUrl = await startTestServer();
    const cls = await Class.create({ name: 'Class 2', section: 'A', level: 'Primary' });
    const me = await Student.create({ firstName: 'Self', lastName: 'Student', gender: 'Male', dob: '2015-01-01', rollNumber: 'S001', class: cls._id, fatherName: 'F', motherName: 'M', phone: '9000000003', address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '123456' }, admissionDate: '2024-01-01' });
    await User.create({ name: 'Student Self', email: 'student1@test.local', password: 'CorrectHorse123', role: 'student', students: [me._id] });
  });
  after(async () => { await stopTestServer(); });

  test('the student overview route accepts no id parameter — there is nothing to tamper with', async () => {
    const cookie = await asRole(baseUrl, 'student1@test.local', 'CorrectHorse123');
    const res = await fetch(`${baseUrl}/api/student/overview`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.student.firstName, 'Self');
  });

  test('a parent-role account cannot use the student-only route', async () => {
    await User.create({ name: 'Some Parent', email: 'parent-only@test.local', password: 'CorrectHorse123', role: 'parent' });
    const cookie = await asRole(baseUrl, 'parent-only@test.local', 'CorrectHorse123');
    const res = await fetch(`${baseUrl}/api/student/overview`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 403);
  });
});

describe('teacher portal — scoped strictly to assigned classes', () => {
  let baseUrl, teacherCookie, ownClass, otherClass, ownStudent, otherStudent;

  before(async () => {
    baseUrl = await startTestServer();
    const teacherProfile = await Teacher.create({ name: 'Ms Scope', designation: 'PGT' });
    ownClass = await Class.create({ name: 'Class 7', section: 'A', level: 'Middle', classTeacher: teacherProfile._id });
    otherClass = await Class.create({ name: 'Class 8', section: 'A', level: 'Middle' }); // no classTeacher — belongs to nobody
    ownStudent = await Student.create({ firstName: 'Own', lastName: 'Kid', gender: 'Male', dob: '2013-01-01', rollNumber: 'T001', class: ownClass._id, fatherName: 'F', motherName: 'M', phone: '9000000004', address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '123456' }, admissionDate: '2024-01-01' });
    otherStudent = await Student.create({ firstName: 'Other', lastName: 'Kid', gender: 'Male', dob: '2013-01-01', rollNumber: 'T002', class: otherClass._id, fatherName: 'F', motherName: 'M', phone: '9000000005', address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '123456' }, admissionDate: '2024-01-01' });
    await User.create({ name: 'Ms Scope', email: 'teacher1@test.local', password: 'CorrectHorse123', role: 'teacher', teacher: teacherProfile._id });
    teacherCookie = await asRole(baseUrl, 'teacher1@test.local', 'CorrectHorse123');
  });
  after(async () => { await stopTestServer(); });

  test('listMyClasses returns only the class this teacher is classTeacher of', async () => {
    const res = await fetch(`${baseUrl}/api/teacher/classes`, { headers: { Cookie: teacherCookie } });
    const body = await res.json();
    assert.equal(body.data.classes.length, 1);
    assert.equal(body.data.classes[0]._id, String(ownClass._id));
  });

  test('a teacher CAN list students in their own assigned class', async () => {
    const res = await fetch(`${baseUrl}/api/teacher/classes/${ownClass._id}/students`, { headers: { Cookie: teacherCookie } });
    assert.equal(res.status, 200);
  });

  test('THE CORE IDOR CHECK: a teacher cannot list students in a class they are not assigned to', async () => {
    const res = await fetch(`${baseUrl}/api/teacher/classes/${otherClass._id}/students`, { headers: { Cookie: teacherCookie } });
    assert.equal(res.status, 403);
  });

  test('the SAME scoping applies to the pre-existing shared attendance roster endpoint, not just the new teacher-portal one', async () => {
    const ownRes = await fetch(`${baseUrl}/api/attendance/roster?classId=${ownClass._id}&date=2026-01-01`, { headers: { Cookie: teacherCookie } });
    assert.equal(ownRes.status, 200);
    const otherRes = await fetch(`${baseUrl}/api/attendance/roster?classId=${otherClass._id}&date=2026-01-01`, { headers: { Cookie: teacherCookie } });
    assert.equal(otherRes.status, 403);
  });

  test('and to the pre-existing shared student list/detail endpoints', async () => {
    const ownRes = await fetch(`${baseUrl}/api/students/${ownStudent._id}`, { headers: { Cookie: teacherCookie } });
    assert.equal(ownRes.status, 200);
    const otherRes = await fetch(`${baseUrl}/api/students/${otherStudent._id}`, { headers: { Cookie: teacherCookie } });
    assert.equal(otherRes.status, 403);
  });

  test('the school-wide today-count endpoint is admin-only, not teacher-accessible — it is not scoped to any class so it does not fit "teacher-appropriate"', async () => {
    const res = await fetch(`${baseUrl}/api/attendance/today`, { headers: { Cookie: teacherCookie } });
    assert.equal(res.status, 403);
  });
});
