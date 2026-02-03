import { env } from './env';

describe('Environment Config', () => {
  describe('Required Variables', () => {
    it('should export env object', () => {
      expect(env).toBeDefined();
    });

    it('should have NODE_ENV', () => {
      expect(env.NODE_ENV).toBeDefined();
      expect(['development', 'test', 'production']).toContain(env.NODE_ENV);
    });

    it('should have PORT as number', () => {
      expect(env.PORT).toBeDefined();
      expect(typeof env.PORT).toBe('number');
    });

    it('should have DATABASE_URL', () => {
      expect(env.DATABASE_URL).toBeDefined();
      expect(typeof env.DATABASE_URL).toBe('string');
    });
  });

  describe('Optional Variables', () => {
    it('should have LOG_LEVEL with valid value', () => {
      if (env.LOG_LEVEL) {
        expect(['debug', 'info', 'warn', 'error', 'silent']).toContain(env.LOG_LEVEL);
      }
    });
  });
});
