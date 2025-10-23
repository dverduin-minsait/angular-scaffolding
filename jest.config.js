module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  testMatch: ['**/+(*.)+(spec).+(ts)'],
  collectCoverage: true,
  coverageReporters: ['html', 'text-summary', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // More lenient thresholds for specific patterns
    './src/app/shared/': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    './src/app/core/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.module.ts',
    '!src/app/testing/*.ts',
    // Exclude route definition files from coverage
    '!src/**/*.routes.ts',
    '!src/**/*.mock.ts',
    '!src/**/*.routes.server.ts',
    '!src/app/app.routes.ts',
    '!src/app/app.routes.server.ts',
    '!src/app/app.config.ts',
    '!src/app/app.config.server.ts',
    '!src/main.ts',
    '!src/main.server.ts',
    '!src/server.ts',
    '!src/environments/**',
    '!src/**/*.stories.ts'
  ],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ]
};