/**
 * Tests for the API configuration module.
 *
 * Because api.ts reads window.location.hostname at module load time,
 * we must set up the mock BEFORE importing the module.
 */

describe('API configuration', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
    jest.resetModules();
  });

  test('uses localhost:5000 in development', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hostname: 'localhost' },
      writable: true,
    });
    jest.resetModules();
    const { API } = require('../utils/api');
    expect(API.baseUrl).toBe('http://localhost:5000');
  });

  test('uses production URL when not on localhost', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hostname: 'writifyapp.vercel.app' },
      writable: true,
    });
    jest.resetModules();
    const { API } = require('../utils/api');
    expect(API.baseUrl).toBe('https://writifyapp.onrender.com');
  });

  test('all auth endpoints use the base URL', () => {
    const { API } = require('../utils/api');
    expect(API.auth.status).toContain(API.baseUrl);
    expect(API.auth.google).toContain(API.baseUrl);
    expect(API.auth.logout).toContain(API.baseUrl);
  });

  test('dynamic endpoint builders return correct URLs', () => {
    const { API } = require('../utils/api');
    expect(API.writers.byId(42)).toBe(`${API.baseUrl}/api/writers/42`);
    expect(API.assignmentRequests.accept(7)).toBe(`${API.baseUrl}/api/assignment-requests/7/accept`);
    expect(API.assignments.byId(99)).toBe(`${API.baseUrl}/api/assignments/99`);
    expect(API.ratings.byUserId(5)).toBe(`${API.baseUrl}/api/ratings/user/5`);
  });

  test('fetchOptions includes credentials', () => {
    const { fetchOptions } = require('../utils/api');
    expect(fetchOptions.credentials).toBe('include');
    expect(fetchOptions.headers['Content-Type']).toBe('application/json');
  });
});
