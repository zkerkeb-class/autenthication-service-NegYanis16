module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests-simples/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/database.js',
    '!server.js',
    '!**/node_modules/**',
    '!**/tests-simples/**',
    '!**/coverage/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  verbose: true,
  testTimeout: 15000,
  clearMocks: true,
}; 