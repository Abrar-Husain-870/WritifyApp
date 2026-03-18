import { debugLog, errorLog, DEBUG_MODE } from '../utils/logUtil';

describe('logUtil', () => {
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('DEBUG_MODE', () => {
    test('is true in test environment (non-production)', () => {
      expect(DEBUG_MODE).toBe(true);
    });
  });

  describe('debugLog', () => {
    test('logs message with [DEBUG] prefix and timestamp', () => {
      debugLog('test message');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const call = consoleSpy.mock.calls[0][0] as string;
      expect(call).toMatch(/^\[DEBUG\] \d{4}-\d{2}-\d{2}T.+ - test message$/);
    });

    test('logs message with data when provided', () => {
      const data = { key: 'value' };
      debugLog('with data', data);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0][1]).toEqual(data);
    });

    test('logs message without data when not provided', () => {
      debugLog('no data');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('no data'));
    });
  });

  describe('errorLog', () => {
    test('logs with [ERROR] prefix and timestamp', () => {
      errorLog('something failed');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const call = errorSpy.mock.calls[0][0] as string;
      expect(call).toMatch(/^\[ERROR\] \d{4}-\d{2}-\d{2}T.+ - something failed$/);
    });

    test('logs with error object when provided', () => {
      const err = new Error('boom');
      errorLog('crash', err);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][1]).toBe(err);
    });

    test('logs without error object when not provided', () => {
      errorLog('no error obj');
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('no error obj'));
    });
  });
});
