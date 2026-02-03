import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';
import { errorHandler, AppError, NotFoundError } from './errorHandler';

describe('Error Handler Middleware', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('AppError', () => {
    it('should create an AppError with message and status code', () => {
      const error = new AppError('Something went wrong', 400);
      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should default to status 500 if not provided', () => {
      const error = new AppError('Server error');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with 404 status', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('Error Handler', () => {
    it('should return JSON error response for AppError', async () => {
      app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
        next(new AppError('Test error', 400));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toBe('Test error');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should return 500 for unknown errors', async () => {
      app.get('/test', () => {
        throw new Error('Unexpected error');
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(500);
      expect(response.body.error.message).toBe('Internal Server Error');
    });

    it('should return 404 for NotFoundError', async () => {
      app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
        next(new NotFoundError('User not found'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('User not found');
    });

    it('should include stack trace in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
        next(new AppError('Dev error', 400));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.body.error).toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
        next(new AppError('Prod error', 400));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.body.error).not.toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });
  });
});
