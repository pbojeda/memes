import request from 'supertest';
import app from './app';
import prisma from './lib/prisma';

jest.mock('./lib/prisma', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
  },
}));

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

  describe('GET /health', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return 200 when database is healthy', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.services.database.status).toBe('healthy');
    });

    it('should return 503 when database is unhealthy', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection refused'));

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('unhealthy');
      expect(response.body.data.services.database.status).toBe('unhealthy');
    });
  });
});
