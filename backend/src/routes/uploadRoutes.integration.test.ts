import request from 'supertest';
import express from 'express';
import * as uploadService from '../application/services/uploadService';
import * as tokenService from '../application/services/tokenService';
import { UserRole } from '../generated/prisma/enums';
import {
  InvalidFileTypeError,
  FileTooLargeError,
  UploadFailedError,
} from '../domain/errors/UploadError';

// Mock dependencies
jest.mock('../application/services/uploadService');
jest.mock('../application/services/tokenService', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  refreshTokens: jest.fn(),
}));

const mockUploadService = uploadService as jest.Mocked<typeof uploadService>;
const mockTokenService = tokenService as jest.Mocked<typeof tokenService>;

// Create test app with routes
const createTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  const routes = require('./index').default;
  testApp.use(routes);
  return testApp;
};

const testApp = createTestApp();

// Helper to set up admin auth
const setupAdminAuth = () => {
  (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
    userId: 'admin-123',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  });
};

// Helper to set up role-based auth
const setupRoleAuth = (role: UserRole) => {
  (mockTokenService.verifyAccessToken as jest.Mock).mockReturnValue({
    userId: `user-${role.toLowerCase()}-123`,
    email: `${role.toLowerCase()}@example.com`,
    role,
  });
};

describe('Upload Routes Integration', () => {
  const mockUploadResult = {
    url: 'https://res.cloudinary.com/test/image/upload/v1/uploads/test-image.jpg',
    filename: 'test-image.jpg',
    size: 102400,
    mimeType: 'image/jpeg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /upload/image', () => {
    it('should return 201 on successful upload by ADMIN', async () => {
      setupAdminAuth();
      (mockUploadService.uploadFile as jest.Mock).mockResolvedValue(mockUploadResult);

      const response = await request(testApp)
        .post('/upload/image')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBe(mockUploadResult.url);
      expect(response.body.data.filename).toBe(mockUploadResult.filename);
      expect(mockUploadService.uploadFile).toHaveBeenCalled();
    });

    it('should return 201 on successful upload by MANAGER', async () => {
      setupRoleAuth(UserRole.MANAGER);
      (mockUploadService.uploadFile as jest.Mock).mockResolvedValue(mockUploadResult);

      const response = await request(testApp)
        .post('/upload/image')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 201 with optional folder field', async () => {
      setupAdminAuth();
      (mockUploadService.uploadFile as jest.Mock).mockResolvedValue(mockUploadResult);

      const response = await request(testApp)
        .post('/upload/image')
        .set('Authorization', 'Bearer valid-token')
        .field('folder', 'products')
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockUploadService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
        }),
        'products'
      );
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(testApp)
        .post('/upload/image')
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(401);
    });

    it('should return 403 for TARGET user', async () => {
      setupRoleAuth(UserRole.TARGET);

      const response = await request(testApp)
        .post('/upload/image')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(403);
    });

    it('should return 403 for MARKETING user', async () => {
      setupRoleAuth(UserRole.MARKETING);

      const response = await request(testApp)
        .post('/upload/image')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(403);
    });

    it('should return 400 when no file provided', async () => {
      setupAdminAuth();

      const response = await request(testApp)
        .post('/upload/image')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_FILE');
    });

    it('should return 400 for invalid file type from service', async () => {
      setupAdminAuth();
      (mockUploadService.uploadFile as jest.Mock).mockRejectedValue(
        new InvalidFileTypeError('application/pdf', 'Only image files are allowed')
      );

      const response = await request(testApp)
        .post('/upload/image')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('fake-pdf-data'), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('should return 400 for file too large from service', async () => {
      setupAdminAuth();
      (mockUploadService.uploadFile as jest.Mock).mockRejectedValue(new FileTooLargeError(5));

      const response = await request(testApp)
        .post('/upload/image')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('fake-large-image-data'), {
          filename: 'large.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
    });

    it('should return 500 for upload failure from service', async () => {
      setupAdminAuth();
      (mockUploadService.uploadFile as jest.Mock).mockRejectedValue(
        new UploadFailedError('Cloud storage unavailable')
      );

      const response = await request(testApp)
        .post('/upload/image')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UPLOAD_FAILED');
    });

    it('should return 400 for file size exceeding multer limit', async () => {
      setupAdminAuth();

      // Create a large buffer that exceeds the 5MB limit
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

      const response = await request(testApp)
        .post('/upload/image')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', largeBuffer, {
          filename: 'large.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
      expect(response.body.error.message).toContain('maximum allowed size');
      // Verify multer rejected the file BEFORE reaching the service
      expect(mockUploadService.uploadFile).not.toHaveBeenCalled();
    });
  });
});
