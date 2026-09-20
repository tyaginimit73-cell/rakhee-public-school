import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer } from './helpers/testServer.js';
import { User } from '../models/User.js';

describe('authentication', () => {
  let baseUrl;

  before(async () => {
    baseUrl = await startTestServer();
    // User.create() triggers the pre('save') hash hook, same as the real
    // admin-creation path in config/seed.js — not a raw insert.
    await User.create({ name: 'Test Admin', email: 'admin@test.local', password: 'CorrectHorse123', role: 'admin' });
  });
  after(async () => { await stopTestServer(); });

  test('login with correct credentials succeeds and sets an httpOnly cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.local', password: 'CorrectHorse123' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.user.email, 'admin@test.local');
    const cookies = res.headers.getSetCookie();
    assert.ok(cookies.some((c) => c.startsWith('rps_token=') && c.includes('HttpOnly')));
  });

  test('login with wrong password is rejected', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.local', password: 'totally-wrong' }),
    });
    assert.equal(res.status, 401);
  });

  test('login for an email that does not exist at all is rejected with the same status/message (and does not crash the dummy-hash comparison path)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody-has-this-email@test.local', password: 'whatever123' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.message, 'Invalid email or password');
  });

  test('GET /api/auth/me without a session is rejected', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
  });

  test('GET /api/auth/me with a valid session cookie succeeds', async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.local', password: 'CorrectHorse123' }),
    });
    const setCookie = loginRes.headers.getSetCookie()[0].split(';')[0]; // "rps_token=..."

    const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: setCookie } });
    assert.equal(meRes.status, 200);
    const body = await meRes.json();
    assert.equal(body.data.email, 'admin@test.local');
  });

  test('an admin-only route rejects a request with no session at all', async () => {
    const res = await fetch(`${baseUrl}/api/users`);
    assert.equal(res.status, 401);
  });
});
