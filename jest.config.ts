const config = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  transform: {
    '^.+\\.tsx?$': ['babel-jest', { configFile: './babel.config.cjs' }],
    '^.+\\.m?js$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(msw|@mswjs|@bundled-es-modules|@open-draft|outvariant|strict-event-emitter|headers-polyfill|rettime|is-node-process|until-async|@whatwg-node)/)',
  ],
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__tests__/mocks/fileMock.ts',
  },
  setupFiles: ['<rootDir>/src/__tests__/setupEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/main.tsx', '!src/**/*.d.ts', '!src/__tests__/**'],
};
export default config;
