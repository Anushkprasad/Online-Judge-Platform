module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  testTimeout: 10000,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
};
