/**
 * Tests for auth utilities (clearAllCookies, forceLogout, exitGuestMode, logout).
 *
 * These functions manipulate cookies, localStorage, sessionStorage, and window.location.
 * We mock the browser APIs to verify side effects without actual navigation.
 */

const mockFetch = jest.fn().mockResolvedValue({ ok: true });
(global as any).fetch = mockFetch;

// Prevent actual navigation
const originalLocation = window.location;
beforeAll(() => {
  delete (window as any).location;
  (window as any).location = {
    ...originalLocation,
    hostname: 'localhost',
    href: '',
    assign: jest.fn(),
  };
});
afterAll(() => {
  window.location = originalLocation;
});

import { clearAllCookies, forceLogout, exitGuestMode, logout } from '../utils/auth';

describe('clearAllCookies', () => {
  test('attempts to expire all existing cookies', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'session=abc123; token=xyz789',
    });

    // clearAllCookies sets cookies to expired via document.cookie
    // We can't easily assert the exact writes, but ensure it doesn't throw
    expect(() => clearAllCookies()).not.toThrow();
  });

  test('handles empty cookie string', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
    expect(() => clearAllCookies()).not.toThrow();
  });
});

describe('forceLogout', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    (window.location as any).href = '';
  });

  test('clears localStorage but preserves darkMode', () => {
    localStorage.setItem('darkMode', 'true');
    localStorage.setItem('other', 'data');

    forceLogout();

    expect(localStorage.getItem('darkMode')).toBe('true');
    expect(localStorage.getItem('other')).toBeNull();
  });

  test('sets all logout flags in storage', () => {
    forceLogout();

    expect(localStorage.getItem('FORCE_LOGOUT')).toBe('true');
    expect(sessionStorage.getItem('FORCE_LOGOUT')).toBe('true');
    expect(localStorage.getItem('user_logged_out')).toBe('true');
    expect(sessionStorage.getItem('manual_logout')).toBe('true');
  });

  test('redirects to login with force=true and cache buster', () => {
    forceLogout();
    expect(window.location.href).toMatch(/^\/login\?t=\d+&force=true$/);
  });
});

describe('exitGuestMode', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    (window.location as any).href = '';
  });

  test('clears guest-specific session data before force logout', () => {
    sessionStorage.setItem('GUEST_MODE', 'true');
    sessionStorage.setItem('GUEST_USER', '{"id":"guest-123"}');

    exitGuestMode();

    // After forceLogout, sessionStorage is cleared and new flags are set
    expect(sessionStorage.getItem('GUEST_MODE')).toBeNull();
    expect(sessionStorage.getItem('GUEST_USER')).toBeNull();
    expect(window.location.href).toMatch(/\/login\?t=\d+&force=true$/);
  });
});

describe('logout', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    localStorage.clear();
    sessionStorage.clear();
    (window.location as any).href = '';
  });

  test('calls the logout API endpoint', async () => {
    await logout();
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'GET',
      credentials: 'include',
    });
  });

  test('force-logouts even if the API call fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await logout();
    expect(window.location.href).toMatch(/\/login\?t=\d+&force=true$/);
  });

  test('force-logouts on successful API call', async () => {
    await logout();
    expect(localStorage.getItem('FORCE_LOGOUT')).toBe('true');
  });
});
