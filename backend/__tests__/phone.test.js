/**
 * Tests for phone number handling utilities extracted from server.js.
 *
 * Because these functions are defined inline in the monolithic server.js
 * (which calls process.exit on import if env vars are missing), we replicate
 * the pure-logic functions here to test their behavior in isolation.
 * This is a deliberate test-seam: if the implementation changes, these
 * tests should be updated to match.
 */

// ── Replicated pure functions from server.js ────────────────────────
function validatePhoneNumber(phoneNumber) {
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phoneNumber.replace(/\D/g, ''));
}

function createShortHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(36).substring(0, 4).padStart(4, '0');
  return hashStr;
}

function generateUniqueId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory lookup table (mirrors server.js)
const whatsappLookup = new Map();

function storeFullPhoneNumber(userId, phoneNumber) {
  if (!userId || !phoneNumber) return false;
  let cleanNumber = phoneNumber.replace(/\D/g, '');
  if (cleanNumber.length >= 10) {
    let userPhones = whatsappLookup.get(userId) || [];
    userPhones.push(cleanNumber);
    whatsappLookup.set(userId, userPhones);
    return true;
  }
  return false;
}

function getFullPhoneNumberByLast4(userId, last4Digits) {
  if (!userId || !last4Digits) return null;
  const userPhones = whatsappLookup.get(userId) || [];
  for (const phone of userPhones) {
    if (phone.endsWith(last4Digits)) return phone;
  }
  return null;
}
// ── End replicated functions ────────────────────────────────────────

describe('validatePhoneNumber', () => {
  test.each([
    ['9876543210', true],
    ['+919876543210', true],
    ['919876543210', true],
    ['1234567890', true],
    ['+12345678901234', true],
    ['123456789012345', true],
  ])('valid: %s → %s', (input, expected) => {
    expect(validatePhoneNumber(input)).toBe(expected);
  });

  test.each([
    ['', false],
    ['12345', false],
    ['123', false],
    ['abc', false],
    ['12345678901234567', false],
  ])('invalid: %s → %s', (input, expected) => {
    expect(validatePhoneNumber(input)).toBe(expected);
  });

  test('strips non-digit characters before validation', () => {
    expect(validatePhoneNumber('+91 987-654-3210')).toBe(true);
    expect(validatePhoneNumber('(98) 765-43210')).toBe(true);
  });
});

describe('createShortHash', () => {
  test('returns a 4-character string', () => {
    const hash = createShortHash('9876543210');
    expect(hash).toHaveLength(4);
  });

  test('is deterministic for the same input', () => {
    const a = createShortHash('9876543210');
    const b = createShortHash('9876543210');
    expect(a).toBe(b);
  });

  test('produces different hashes for different inputs', () => {
    const a = createShortHash('9876543210');
    const b = createShortHash('1234567890');
    expect(a).not.toBe(b);
  });

  test('handles empty string', () => {
    const hash = createShortHash('');
    expect(hash).toHaveLength(4);
  });
});

describe('generateUniqueId', () => {
  test('returns a 6-digit string', () => {
    const id = generateUniqueId();
    expect(id).toMatch(/^\d{6}$/);
  });

  test('is between 100000 and 999999', () => {
    for (let i = 0; i < 100; i++) {
      const num = parseInt(generateUniqueId(), 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });

  test('generates varied IDs (not all identical)', () => {
    const ids = new Set(Array.from({ length: 50 }, generateUniqueId));
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe('WhatsApp Lookup Table', () => {
  beforeEach(() => {
    whatsappLookup.clear();
  });

  test('stores and retrieves a full phone number', () => {
    storeFullPhoneNumber(1, '919876543210');
    expect(getFullPhoneNumberByLast4(1, '3210')).toBe('919876543210');
  });

  test('returns null for unknown user', () => {
    expect(getFullPhoneNumberByLast4(999, '3210')).toBeNull();
  });

  test('returns null when last 4 digits do not match', () => {
    storeFullPhoneNumber(1, '919876543210');
    expect(getFullPhoneNumberByLast4(1, '9999')).toBeNull();
  });

  test('stores multiple numbers for the same user', () => {
    storeFullPhoneNumber(1, '919876543210');
    storeFullPhoneNumber(1, '918765432109');
    expect(getFullPhoneNumberByLast4(1, '3210')).toBe('919876543210');
    expect(getFullPhoneNumberByLast4(1, '2109')).toBe('918765432109');
  });

  test('rejects numbers shorter than 10 digits', () => {
    const result = storeFullPhoneNumber(1, '12345');
    expect(result).toBe(false);
    expect(getFullPhoneNumberByLast4(1, '2345')).toBeNull();
  });

  test('strips non-digit characters before storing', () => {
    storeFullPhoneNumber(1, '+91-987-654-3210');
    expect(getFullPhoneNumberByLast4(1, '3210')).toBe('919876543210');
  });

  test('handles null/undefined inputs', () => {
    expect(storeFullPhoneNumber(null, '919876543210')).toBe(false);
    expect(storeFullPhoneNumber(1, null)).toBe(false);
    expect(getFullPhoneNumberByLast4(null, '3210')).toBeNull();
    expect(getFullPhoneNumberByLast4(1, null)).toBeNull();
  });

  test('users are isolated from each other', () => {
    storeFullPhoneNumber(1, '919876543210');
    storeFullPhoneNumber(2, '918765432109');
    expect(getFullPhoneNumberByLast4(1, '2109')).toBeNull();
    expect(getFullPhoneNumberByLast4(2, '3210')).toBeNull();
  });
});
