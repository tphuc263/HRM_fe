import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth mock
  http.post('*/auth/login', () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'mock-token',
      },
    });
  }),
  http.get('*/auth/me', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        username: 'admin',
        role: 'ADMIN',
      },
    });
  }),
];
