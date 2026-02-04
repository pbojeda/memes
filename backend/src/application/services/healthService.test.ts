import { checkHealth } from './healthService';
import prisma from '../../lib/prisma';

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
  },
}));

describe('HealthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkHealth', () => {
    describe('when database is connected', () => {
      it('should return healthy status', async () => {
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

        const result = await checkHealth();

        expect(result.status).toBe('healthy');
        expect(result.services.database.status).toBe('healthy');
      });

      it('should include version from package.json', async () => {
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

        const result = await checkHealth();

        expect(result.version).toBe('0.1.0');
      });

      it('should include timestamp', async () => {
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

        const result = await checkHealth();

        expect(result.timestamp).toBeDefined();
        expect(new Date(result.timestamp).getTime()).not.toBeNaN();
      });

      it('should include database latency', async () => {
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

        const result = await checkHealth();

        expect(result.services.database.latency).toBeDefined();
        expect(typeof result.services.database.latency).toBe('number');
      });
    });

    describe('when database connection fails', () => {
      it('should return unhealthy status', async () => {
        (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection refused'));

        const result = await checkHealth();

        expect(result.status).toBe('unhealthy');
        expect(result.services.database.status).toBe('unhealthy');
      });

      it('should include error message', async () => {
        (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection refused'));

        const result = await checkHealth();

        expect(result.services.database.error).toBe('Connection refused');
      });

      it('should not include latency when unhealthy', async () => {
        (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection refused'));

        const result = await checkHealth();

        expect(result.services.database.latency).toBeUndefined();
      });
    });
  });
});
