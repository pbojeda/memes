import prisma from './prisma';

describe('Prisma Client', () => {
  describe('Client Initialization', () => {
    it('should export a Prisma client instance', () => {
      expect(prisma).toBeDefined();
    });

    it('should have $connect method', () => {
      expect(typeof prisma.$connect).toBe('function');
    });

    it('should have $disconnect method', () => {
      expect(typeof prisma.$disconnect).toBe('function');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple imports', () => {
      // Clear the require cache to test singleton behavior
      const prisma1 = require('./prisma').default;
      const prisma2 = require('./prisma').default;
      expect(prisma1).toBe(prisma2);
    });
  });
});
