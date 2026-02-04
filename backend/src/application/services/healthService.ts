import prisma from '../../lib/prisma';

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    database: ServiceHealth;
  };
}

async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkHealth(): Promise<HealthStatus> {
  const database = await checkDatabase();

  const isHealthy = database.status === 'healthy';

  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    services: {
      database,
    },
  };
}
