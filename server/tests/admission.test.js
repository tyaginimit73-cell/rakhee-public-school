import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer } from './helpers/testServer.js';

const validApplication = () => ({
  studentName: 'Test Student',
  dob: '2015-05-10',
  gender: 'Male',
  classApplyingFor: 'Class 1',
  fatherName: 'Test Father',
  motherName: 'Test Mother',
  phone: '9876543210',
  address: { line1: '123 Test Street', city: 'Testville', district: 'Test District', state: 'Test State', pincode: '123456' },
});

describe('admission flow', () => {
  let baseUrl;
  before(async () => { baseUrl = await startTestServer(); });
  after(async () => { await stopTestServer(); });

  test('submitting a valid application returns an RPS-YYYY-NNNN id and an upload token', async () => {
    const res = await fetch(`${baseUrl}/api/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validApplication()),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.match(body.data.applicationId, /^RPS-\d{4}-\d{4}$/);
    assert.equal(typeof body.data.uploadToken, 'string');
    assert.ok(body.data.uploadToken.length > 20);
  });

  test('concurrent submissions never collide on applicationId (atomic counter, not countDocuments()+1)', async () => {
    // This is the direct regression test for the race condition described
    // in PROJECT_AUDIT.md: the old `countDocuments() + 1` approach could
    // read the same count from two simultaneous requests.
    const submissions = await Promise.all(
      Array.from({ length: 8 }, () => fetch(`${baseUrl}/api/admissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validApplication()),
      }).then((r) => r.json())),
    );
    const ids = submissions.map((s) => s.data.applicationId);
    assert.equal(new Set(ids).size, ids.length, `expected ${ids.length} unique IDs, got duplicates: ${ids.join(', ')}`);
  });

  test('public tracking requires the correct phone number, not just the applicationId', async () => {
    const submitRes = await fetch(`${baseUrl}/api/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validApplication()),
    });
    const { data } = await submitRes.json();

    const wrongPhone = await fetch(`${baseUrl}/api/admissions/track?applicationId=${data.applicationId}&phone=0000000000`);
    assert.equal(wrongPhone.status, 404);

    const rightPhone = await fetch(`${baseUrl}/api/admissions/track?applicationId=${data.applicationId}&phone=9876543210`);
    assert.equal(rightPhone.status, 200);
  });

  test('public tracking response never includes admin notes or who changed the status', async () => {
    const submitRes = await fetch(`${baseUrl}/api/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validApplication()),
    });
    const { data } = await submitRes.json();

    const trackRes = await fetch(`${baseUrl}/api/admissions/track?applicationId=${data.applicationId}&phone=9876543210`);
    const trackBody = await trackRes.json();
    const raw = JSON.stringify(trackBody);

    // These fields exist on the underlying Mongoose document (a raw
    // `res.json(admission)` — the old behavior — would include them) and
    // must not appear anywhere in the public tracking response.
    assert.equal(trackBody.data.notes, undefined);
    assert.equal(raw.includes('"documents"'), false, 'uploaded document paths must not be exposed via public tracking');
    if (trackBody.data.statusHistory?.length) {
      assert.equal(trackBody.data.statusHistory[0].by, undefined, 'status history must not expose who made the change');
    }
    // What SHOULD still be there, so this is a field-minimization test and
    // not just a "delete everything" test:
    assert.equal(trackBody.data.applicationId, data.applicationId);
    assert.equal(trackBody.data.status, 'Submitted');
  });

  test('document upload is rejected without a valid upload token', async () => {
    const submitRes = await fetch(`${baseUrl}/api/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validApplication()),
    });
    const { data } = await submitRes.json();

    const fd = new FormData();
    fd.append('documents', new Blob(['%PDF-1.4 fake but signature-valid'], { type: 'application/pdf' }), 'doc.pdf');
    // Deliberately no uploadToken field at all — this is exactly the old
    // vulnerability: only knowing/guessing the applicationId.
    const res = await fetch(`${baseUrl}/api/admissions/${data.applicationId}/documents`, { method: 'POST', body: fd });
    assert.equal(res.status, 401);
  });

  test('document upload is rejected when the token belongs to a different application', async () => {
    const submitA = await fetch(`${baseUrl}/api/admissions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validApplication()),
    }).then((r) => r.json());
    const submitB = await fetch(`${baseUrl}/api/admissions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validApplication()),
    }).then((r) => r.json());

    const fd = new FormData();
    fd.append('documents', new Blob(['%PDF-1.4 fake but signature-valid'], { type: 'application/pdf' }), 'doc.pdf');
    fd.append('uploadToken', submitA.data.uploadToken); // token for A, URL for B

    const res = await fetch(`${baseUrl}/api/admissions/${submitB.data.applicationId}/documents`, { method: 'POST', body: fd });
    assert.equal(res.status, 401);
  });

  test('document upload succeeds with the matching token', async () => {
    const submitRes = await fetch(`${baseUrl}/api/admissions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validApplication()),
    });
    const { data } = await submitRes.json();

    const fd = new FormData();
    fd.append('documents', new Blob(['%PDF-1.4 fake but signature-valid'], { type: 'application/pdf' }), 'doc.pdf');
    fd.append('labels', 'Birth Certificate');
    fd.append('uploadToken', data.uploadToken);

    const res = await fetch(`${baseUrl}/api/admissions/${data.applicationId}/documents`, { method: 'POST', body: fd });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.documents.length, 1);
  });

  test('a file whose content does not match its extension is rejected', async () => {
    const submitRes = await fetch(`${baseUrl}/api/admissions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validApplication()),
    });
    const { data } = await submitRes.json();

    const fd = new FormData();
    // .pdf extension, but the content is plain text with no PDF signature.
    fd.append('documents', new Blob(['not actually a pdf'], { type: 'application/pdf' }), 'doc.pdf');
    fd.append('uploadToken', data.uploadToken);

    const res = await fetch(`${baseUrl}/api/admissions/${data.applicationId}/documents`, { method: 'POST', body: fd });
    assert.equal(res.status, 400);
  });

  test('admin-only admission list rejects unauthenticated requests', async () => {
    const res = await fetch(`${baseUrl}/api/admissions`);
    assert.equal(res.status, 401);
  });
});
