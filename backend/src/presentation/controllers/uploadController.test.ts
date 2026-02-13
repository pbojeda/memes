import { Request, Response, NextFunction } from 'express';
import { uploadImage } from './uploadController';
import * as uploadService from '../../application/services/uploadService';
import { InvalidFileTypeError, FileTooLargeError, UploadFailedError } from '../../domain/errors/UploadError';

jest.mock('../../application/services/uploadService');

describe('uploadController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      file: {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: {} as any,
        destination: '',
        filename: '',
        path: '',
      },
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload file successfully and return 201', async () => {
      const mockResult = {
        url: 'https://res.cloudinary.com/test/image.jpg',
        filename: 'memestore/products/abc-123',
        size: 1024,
        mimeType: 'image/jpeg',
      };

      (uploadService.uploadFile as jest.Mock).mockResolvedValue(mockResult);

      await uploadImage(mockReq as Request, mockRes as Response, mockNext);

      expect(uploadService.uploadFile).toHaveBeenCalledWith(mockReq.file, undefined);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should upload file with folder parameter', async () => {
      const mockResult = {
        url: 'https://res.cloudinary.com/test/image.jpg',
        filename: 'memestore/products/abc-123',
        size: 1024,
        mimeType: 'image/jpeg',
      };

      mockReq.body = { folder: 'products' };

      (uploadService.uploadFile as jest.Mock).mockResolvedValue(mockResult);

      await uploadImage(mockReq as Request, mockRes as Response, mockNext);

      expect(uploadService.uploadFile).toHaveBeenCalledWith(mockReq.file, 'products');
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if file is missing', async () => {
      mockReq.file = undefined;

      await uploadImage(mockReq as Request, mockRes as Response, mockNext);

      expect(uploadService.uploadFile).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'No file provided',
          code: 'NO_FILE',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for InvalidFileTypeError', async () => {
      const error = new InvalidFileTypeError('application/pdf');

      (uploadService.uploadFile as jest.Mock).mockRejectedValue(error);

      await uploadImage(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for FileTooLargeError', async () => {
      const error = new FileTooLargeError(5);

      (uploadService.uploadFile as jest.Mock).mockRejectedValue(error);

      await uploadImage(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 for UploadFailedError', async () => {
      const error = new UploadFailedError('Network timeout');

      (uploadService.uploadFile as jest.Mock).mockRejectedValue(error);

      await uploadImage(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() for unknown errors', async () => {
      const error = new Error('Unknown error');

      (uploadService.uploadFile as jest.Mock).mockRejectedValue(error);

      await uploadImage(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});
