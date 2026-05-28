import '@testing-library/jest-dom';
import { server } from './mocks/server';
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });

const { TransformStream, ReadableStream, WritableStream } = require('stream/web');
Object.assign(global, { TransformStream, ReadableStream, WritableStream });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Suppress known Radix UI act() warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('not wrapped in act')
    ) {
      return; // suppress
    }
    originalError.call(console, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
