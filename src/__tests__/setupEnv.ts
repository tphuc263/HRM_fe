process.env.TZ = 'Asia/Ho_Chi_Minh';
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

// Polyfill sessionStorage & localStorage for Node environment
if (typeof global.sessionStorage === 'undefined') {
  const storage: Record<string, string> = {};
  // @ts-ignore
  global.sessionStorage = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => { storage[key] = String(value); },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => {
      Object.keys(storage).forEach(key => delete storage[key]);
    },
    get length() { return Object.keys(storage).length; },
    key: (index: number) => Object.keys(storage)[index] || null,
  };
}

if (typeof global.localStorage === 'undefined') {
  const storage: Record<string, string> = {};
  // @ts-ignore
  global.localStorage = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => { storage[key] = String(value); },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => {
      Object.keys(storage).forEach(key => delete storage[key]);
    },
    get length() { return Object.keys(storage).length; },
    key: (index: number) => Object.keys(storage)[index] || null,
  };
}

// Set env vars for apiClient fallback via process.env
process.env.VITE_API_BASE_URL = 'http://localhost/api/v1';
