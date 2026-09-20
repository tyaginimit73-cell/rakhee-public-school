import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer } from './helpers/testServer.js';

describe('health & baseline routing', () => {
  let baseUrl;

  before(async () => { baseUrl = await startTestServer(); });
  after(async () => { await stopTestServer(); });

  test('GET /api/health returns success', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });

  test('unknown route returns 404 with JSON, not a stack trace', async () => {
    const res = await fetch(`${baseUrl}/api/this-route-does-not-exist`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    // Phase 2.9: error responses must never leak stack traces.
    assert.equal(JSON.stringify(body).toLowerCase().includes('at object.'), false);
  });

  test('malformed JSON body returns 400, not 500', async () => {
    const res = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ this is not valid json',
    });
    assert.equal(res.status, 400);
  });
});
