import '@testing-library/jest-dom';
import { server } from './mocks/server';
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });

const { TransformStream, ReadableStream, WritableStream } = require('stream/web');
Object.assign(global, { TransformStream, ReadableStream, WritableStream });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
