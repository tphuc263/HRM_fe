const { TextEncoder, TextDecoder } = require('util');
Object.assign(global, { TextDecoder, TextEncoder });

require('whatwg-fetch');
// Mock import.meta.env
Object.defineProperty(global, 'importMeta', {
  value: {
    env: { VITE_API_BASE_URL: 'http://localhost:8080/api/v1' }
  }
});
