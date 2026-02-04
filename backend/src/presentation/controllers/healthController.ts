import { Request, Response, NextFunction } from 'express';
import { checkHealth } from '../../application/services/healthService';

export async function getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const healthStatus = await checkHealth();

    if (healthStatus.status === 'healthy') {
      res.status(200).json({
        success: true,
        data: healthStatus,
      });
    } else {
      res.status(503).json({
        success: false,
        error: {
          message: 'Service unhealthy',
          code: 'SERVICE_UNAVAILABLE',
        },
        data: healthStatus,
      });
    }
  } catch (error) {
    next(error);
  }
}
