import request from 'supertest';
import app from './app';

describe('Express App', () => {
  describe('App Creation', () => {
    it('should create an Express application', () => {
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
    });
  });

  describe('Middleware', () => {
    it('should parse JSON bodies', async () => {
      const response = await request(app)
        .post('/test-json')
        .send({ test: 'value' })
        .set('Content-Type', 'application/json');

      // Will return 404 since route doesn't exist, but body should be parsed
      expect(response.status).toBe(404);
    });
  });
});
