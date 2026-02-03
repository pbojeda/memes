import logger from './logger';

describe('Logger', () => {
  describe('Logger Instance', () => {
    it('should export a logger instance', () => {
      expect(logger).toBeDefined();
    });

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('Child Loggers', () => {
    it('should create child loggers with context', () => {
      const child = logger.child({ module: 'test' });
      expect(child).toBeDefined();
      expect(typeof child.info).toBe('function');
    });
  });
});
