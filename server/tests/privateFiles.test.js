import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer } from './helpers/testServer.js';
import { User } from '../models/User.js';
import { Teacher } from '../models/Teacher.js';

describe('?all=true is admin-gated, not just parameter-gated', () => {
  let baseUrl;
  let adminCookie;

  before(async () => {
    baseUrl = await startTestServer();
    await User.create({ name: 'Admin', email: 'admin2@test.local', password: 'CorrectHorse123', role: 'admin' });
    await Teacher.create({ name: 'Active Teacher', designation: 'PGT', qualification: 'M.Ed', department: 'Science', isActive: true });
    await Teacher.create({ name: 'Retired Teacher', designation: 'Former Staff', qualification: 'M.A', department: 'Arts', isActive: false });

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin2@test.local', password: 'CorrectHorse123' }),
    });
    adminCookie = loginRes.headers.getSetCookie()[0].split(';')[0];
  });
  after(async () => { await stopTestServer(); });

  test('unauthenticated ?all=true does NOT bypass the isActive filter (the actual vulnerability)', async () => {
    const res = await fetch(`${baseUrl}/api/teachers?all=true`);
    assert.equal(res.status, 200);
    const body = await res.json();
    const names = body.data.items.map((t) => t.name);
    assert.ok(names.includes('Active Teacher'));
    assert.equal(names.includes('Retired Teacher'), false, 'inactive teacher leaked to an unauthenticated ?all=true request');
  });

  test('unauthenticated request with NO all param behaves the same as before (sanity check — not a regression)', async () => {
    const res = await fetch(`${baseUrl}/api/teachers`);
    const body = await res.json();
    assert.equal(body.data.items.some((t) => t.name === 'Retired Teacher'), false);
  });

  test('an authenticated ADMIN with ?all=true genuinely sees inactive records (the feature still works for its real users)', async () => {
    const res = await fetch(`${baseUrl}/api/teachers?all=true`, { headers: { Cookie: adminCookie } });
    const body = await res.json();
    const names = body.data.items.map((t) => t.name);
    assert.ok(names.includes('Retired Teacher'), 'admin dashboard would break: ?all=true no longer works for a real admin');
  });
});

describe('private uploads are never reachable via the public /uploads/ static route', () => {
  let baseUrl;
  before(async () => { baseUrl = await startTestServer(); });
  after(async () => { await stopTestServer(); });

  test('a submitted admission document is not reachable at /uploads/<filename>', async () => {
    const submitRes = await fetch(`${baseUrl}/api/admissions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: 'Private File Test', dob: '2015-05-10', gender: 'Male', classApplyingFor: 'Class 1',
        fatherName: 'F', motherName: 'M', phone: '9998887777',
        address: { line1: 'x', city: 'x', district: 'x', state: 'x', pincode: '123456' },
      }),
    }).then((r) => r.json());

    const fd = new FormData();
    fd.append('documents', new Blob(['%PDF-1.4 test'], { type: 'application/pdf' }), 'birth-cert.pdf');
    fd.append('uploadToken', submitRes.data.uploadToken);
    const uploadRes = await fetch(`${baseUrl}/api/admissions/${submitRes.data.applicationId}/documents`, { method: 'POST', body: fd })
      .then((r) => r.json());
    const filename = uploadRes.data.documents[0].filename;

    // This is the actual property Issue 2 exists to guarantee: knowing
    // the generated filename is not enough to fetch the file directly.
    const directRes = await fetch(`${baseUrl}/uploads/${filename}`);
    assert.equal(directRes.status, 404);
  });

  test('GET /api/documents/:id/download requires authentication', async () => {
    const res = await fetch(`${baseUrl}/api/documents/000000000000000000000000/download`);
    assert.equal(res.status, 401);
  });

  test('GET /api/admissions/:applicationId/documents/:filename/download requires admin authentication', async () => {
    const res = await fetch(`${baseUrl}/api/admissions/RPS-2026-0001/documents/whatever.pdf/download`);
    assert.equal(res.status, 401);
  });
});
