import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer } from './helpers/testServer.js';

describe('CORS allowlist', () => {
  let baseUrl;
  let originalClientUrl;
  let originalNodeEnv;

  before(async () => { baseUrl = await startTestServer(); });
  after(async () => { await stopTestServer(); });

  beforeEach(() => {
    originalClientUrl = process.env.CLIENT_URL;
    originalNodeEnv = process.env.NODE_ENV;
  });
  afterEach(() => {
    process.env.CLIENT_URL = originalClientUrl;
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('in production, a request from an origin not on the allowlist is rejected', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'https://real-school-site.example';

    const res = await fetch(`${baseUrl}/api/health`, { headers: { Origin: 'https://evil-site.example' } });
    // The bug this replaces called callback(null, true) unconditionally —
    // every origin was allowed regardless of this check's result. This
    // must now be a rejection, not a 200.
    assert.equal(res.status, 403);
    assert.notEqual(res.headers.get('access-control-allow-origin'), 'https://evil-site.example');
  });

  test('in production, a request from the configured CLIENT_URL is allowed', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'https://real-school-site.example';

    const res = await fetch(`${baseUrl}/api/health`, { headers: { Origin: 'https://real-school-site.example' } });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://real-school-site.example');
  });

  test('CLIENT_URL can list more than one allowed origin, comma-separated', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'https://www.real-school-site.example,https://real-school-site.example';

    const withWww = await fetch(`${baseUrl}/api/health`, { headers: { Origin: 'https://www.real-school-site.example' } });
    assert.equal(withWww.status, 200);
    const withoutWww = await fetch(`${baseUrl}/api/health`, { headers: { Origin: 'https://real-school-site.example' } });
    assert.equal(withoutWww.status, 200);
  });

  test('a request with no Origin header at all (curl, server-to-server) is still allowed', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'https://real-school-site.example';

    const res = await fetch(`${baseUrl}/api/health`); // no Origin header
    assert.equal(res.status, 200);
  });
});
