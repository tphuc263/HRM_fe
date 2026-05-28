const { TextEncoder, TextDecoder } = require('util');
Object.assign(global, { TextDecoder, TextEncoder });

// Polyfill Web Streams API for MSW compatibility in jsdom
const { TransformStream, ReadableStream, WritableStream } = require('stream/web');
Object.assign(global, { TransformStream, ReadableStream, WritableStream });

// Polyfill BroadcastChannel for MSW
if (typeof global.BroadcastChannel === 'undefined') {
  // @ts-ignore
  global.BroadcastChannel = class BroadcastChannel {
    constructor() {}
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

require('whatwg-fetch');

// Set env vars for apiClient fallback via process.env
process.env.VITE_API_BASE_URL = 'http://localhost/api/v1';
