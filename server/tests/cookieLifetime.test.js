import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { jwtLifetimeMs, setAuthCookie, COOKIE_FALLBACK_MAX_AGE_MS } from '../utils/token.js';

// Focused tests for the Phase 3 / L2 change: the auth cookie's maxAge now
// derives from JWT_EXPIRES_IN (same value signToken uses) instead of a
// hardcoded 7 days. Pure unit tests — no MongoDB, no server needed.

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

let savedExpiresIn;
beforeEach(() => { savedExpiresIn = process.env.JWT_EXPIRES_IN; delete process.env.JWT_EXPIRES_IN; });
afterEach(() => {
  if (savedExpiresIn === undefined) delete process.env.JWT_EXPIRES_IN;
  else process.env.JWT_EXPIRES_IN = savedExpiresIn;
});

// Captures what setAuthCookie passes to res.cookie, without Express.
const captureCookie = () => {
  const calls = [];
  const res = { cookie: (...args) => calls.push(args), clearCookie: () => {} };
  return { calls, res };
};

describe('L2 — jwtLifetimeMs parses JWT_EXPIRES_IN like jsonwebtoken/ms', () => {
  test('unset / empty value falls back to the same 7d default as signToken', () => {
    assert.equal(jwtLifetimeMs(), 7 * DAY);
    process.env.JWT_EXPIRES_IN = '';
    assert.equal(jwtLifetimeMs(), 7 * DAY);
  });

  test('the documented 7d produces a 7-day lifetime', () => {
    assert.equal(jwtLifetimeMs('7d'), 7 * DAY);
  });

  test('common unit forms: seconds, minutes, hours, days', () => {
    assert.equal(jwtLifetimeMs('90s'), 90 * 1000);
    assert.equal(jwtLifetimeMs('30m'), 30 * MINUTE);
    assert.equal(jwtLifetimeMs('1h'), HOUR);
    assert.equal(jwtLifetimeMs('12h'), 12 * HOUR);
    assert.equal(jwtLifetimeMs('2d'), 2 * DAY);
  });

  test('long-form and fractional durations', () => {
    assert.equal(jwtLifetimeMs('2 days'), 2 * DAY);
    assert.equal(jwtLifetimeMs('1 hour'), HOUR);
    assert.equal(jwtLifetimeMs('45 minutes'), 45 * MINUTE);
    assert.equal(jwtLifetimeMs('1.5h'), 90 * MINUTE);
    assert.equal(jwtLifetimeMs('1 week'), 7 * DAY);
  });

  test('a bare NUMBER means seconds (jsonwebtoken semantics)', () => {
    assert.equal(jwtLifetimeMs(3600), HOUR);
    assert.equal(jwtLifetimeMs(60), MINUTE);
  });

  test('a bare numeric STRING means milliseconds (ms/jwt quirk, mirrored faithfully)', () => {
    assert.equal(jwtLifetimeMs('500'), 500);
  });

  test('different supported values produce matching cookie lifetimes (used via env)', () => {
    process.env.JWT_EXPIRES_IN = '1h';
    assert.equal(jwtLifetimeMs(), HOUR);
    process.env.JWT_EXPIRES_IN = '30d';
    assert.equal(jwtLifetimeMs(), 30 * DAY);
  });

  test('invalid / unsupported values return null (never a guessed lifetime)', () => {
    for (const bad of ['abc', '5x', '-1d', '0', '0d', 'd7', 'seven days', '  ', {}, true]) {
      assert.equal(jwtLifetimeMs(bad), null, `${JSON.stringify(bad)} must not parse`);
    }
  });

  test('null / undefined / empty are treated as UNSET (7d), mirroring signToken\'s falsy default', () => {
    // signToken uses `process.env.JWT_EXPIRES_IN || '7d'`, so any falsy value
    // means the token itself gets 7d — the cookie must match that exactly.
    assert.equal(jwtLifetimeMs(null), 7 * DAY);
    assert.equal(jwtLifetimeMs(undefined), 7 * DAY);
    assert.equal(jwtLifetimeMs(''), 7 * DAY);
  });
});

describe('L2 — setAuthCookie derives maxAge from JWT_EXPIRES_IN', () => {
  test('default (unset) keeps the exact previous behavior: 7-day cookie', () => {
    const { calls, res } = captureCookie();
    setAuthCookie(res, 'token-x');
    const [name, token, opts] = calls[0];
    assert.equal(name, 'rps_token');
    assert.equal(token, 'token-x');
    assert.equal(opts.maxAge, 7 * DAY);
    // every other cookie attribute is untouched by this change:
    assert.equal(opts.httpOnly, true);
    assert.equal(opts.sameSite, 'lax');
    assert.equal(opts.secure, process.env.NODE_ENV === 'production');
  });

  test('a configured lifetime flows into the cookie maxAge', () => {
    process.env.JWT_EXPIRES_IN = '1h';
    const { calls, res } = captureCookie();
    setAuthCookie(res, 'token-y');
    assert.equal(calls[0][2].maxAge, HOUR);
  });

  test('an invalid duration does NOT silently create an unsafe lifetime — documented 7d fallback + warning', () => {
    process.env.JWT_EXPIRES_IN = 'not-a-duration';
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (msg) => warnings.push(String(msg));
    try {
      const { calls, res } = captureCookie();
      setAuthCookie(res, 'token-z');
      assert.equal(calls[0][2].maxAge, COOKIE_FALLBACK_MAX_AGE_MS);
      assert.equal(calls[0][2].maxAge, 7 * DAY);
      assert.equal(warnings.length, 1, 'the fallback must be announced, not silent');
      assert.match(warnings[0], /not a recognized duration/);
    } finally {
      console.warn = originalWarn;
    }
  });

  test('valid durations do not warn', () => {
    process.env.JWT_EXPIRES_IN = '7d';
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (msg) => warnings.push(String(msg));
    try {
      const { res } = captureCookie();
      setAuthCookie(res, 'token-q');
      assert.equal(warnings.length, 0);
    } finally {
      console.warn = originalWarn;
    }
  });
});
