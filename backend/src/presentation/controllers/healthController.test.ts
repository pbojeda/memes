import { Request, Response, NextFunction } from 'express';
import { getHealth } from './healthController';
import * as healthService from '../../application/services/healthService';

jest.mock('../../application/services/healthService');

describe('HealthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('getHealth', () => {
    describe('when all services are healthy', () => {
      it('should return 200 status', async () => {
        const healthyStatus = {
          status: 'healthy' as const,
          version: '0.1.0',
          timestamp: '2026-02-04T10:30:00.000Z',
          services: {
            database: { status: 'healthy' as const, latency: 5 },
          },
        };

        (healthService.checkHealth as jest.Mock).mockResolvedValue(healthyStatus);

        await getHealth(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      it('should return success response with health data', async () => {
        const healthyStatus = {
          status: 'healthy' as const,
          version: '0.1.0',
          timestamp: '2026-02-04T10:30:00.000Z',
          services: {
            database: { status: 'healthy' as const, latency: 5 },
          },
        };

        (healthService.checkHealth as jest.Mock).mockResolvedValue(healthyStatus);

        await getHealth(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: healthyStatus,
        });
      });

      it('should call healthService.checkHealth()', async () => {
        const healthyStatus = {
          status: 'healthy' as const,
          version: '0.1.0',
          timestamp: '2026-02-04T10:30:00.000Z',
          services: {
            database: { status: 'healthy' as const, latency: 5 },
          },
        };

        (healthService.checkHealth as jest.Mock).mockResolvedValue(healthyStatus);

        await getHealth(mockRequest as Request, mockResponse as Response, mockNext);

        expect(healthService.checkHealth).toHaveBeenCalledTimes(1);
      });
    });

    describe('when service is unhealthy', () => {
      it('should return 503 status', async () => {
        const unhealthyStatus = {
          status: 'unhealthy' as const,
          version: '0.1.0',
          timestamp: '2026-02-04T10:30:00.000Z',
          services: {
            database: { status: 'unhealthy' as const, error: 'Connection refused' },
          },
        };

        (healthService.checkHealth as jest.Mock).mockResolvedValue(unhealthyStatus);

        await getHealth(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(503);
      });

      it('should return error response with health data', async () => {
        const unhealthyStatus = {
          status: 'unhealthy' as const,
          version: '0.1.0',
          timestamp: '2026-02-04T10:30:00.000Z',
          services: {
            database: { status: 'unhealthy' as const, error: 'Connection refused' },
          },
        };

        (healthService.checkHealth as jest.Mock).mockResolvedValue(unhealthyStatus);

        await getHealth(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            message: 'Service unhealthy',
            code: 'SERVICE_UNAVAILABLE',
          },
          data: unhealthyStatus,
        });
      });
    });

    describe('when unexpected error occurs', () => {
      it('should call next with error', async () => {
        const error = new Error('Unexpected error');
        (healthService.checkHealth as jest.Mock).mockRejectedValue(error);

        await getHealth(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });
  });
});
