import request from 'supertest';

const BASE = process.env.PP_BASE_URL || 'http://localhost:5000';

describe('Health check', () => {
  it('GET /health returns a response', async () => {
    const res = await request(BASE).get('/health');
    expect(res.status).toBe(200);
  });
});
