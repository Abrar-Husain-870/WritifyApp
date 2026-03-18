module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'security.js',
    'server.js',
    'db/**/*.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],
  clearMocks: true,
  restoreMocks: true,
  forceExit: true,
};
