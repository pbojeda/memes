import { uploadFile } from './uploadService';
import { InvalidFileTypeError, FileTooLargeError, UploadFailedError } from '../../domain/errors/UploadError';
import { CloudinaryAdapter } from '../../infrastructure/storage/CloudinaryAdapter';

// Mock CloudinaryAdapter
jest.mock('../../infrastructure/storage/CloudinaryAdapter');

describe('uploadService', () => {
  const createMockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('test file content'),
    stream: {} as any,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file successfully and return result', async () => {
      const mockFile = createMockFile();
      const mockUploadResult = {
        url: 'https://res.cloudinary.com/test/image/upload/v123/memestore/products/abc-123.jpg',
        publicId: 'memestore/products/abc-123',
        size: 1024,
      };

      (CloudinaryAdapter.prototype.upload as jest.Mock).mockResolvedValue(mockUploadResult);

      const result = await uploadFile(mockFile, 'products');

      expect(result).toEqual({
        url: mockUploadResult.url,
        filename: mockUploadResult.publicId,
        size: mockUploadResult.size,
        mimeType: mockFile.mimetype,
      });

      expect(CloudinaryAdapter.prototype.upload).toHaveBeenCalledWith(mockFile.buffer, {
        folder: 'products',
      });
    });

    it('should upload without folder (undefined)', async () => {
      const mockFile = createMockFile();
      const mockUploadResult = {
        url: 'https://res.cloudinary.com/test/image/upload/v123/memestore/misc/def-456.jpg',
        publicId: 'memestore/misc/def-456',
        size: 512,
      };

      (CloudinaryAdapter.prototype.upload as jest.Mock).mockResolvedValue(mockUploadResult);

      const result = await uploadFile(mockFile);

      expect(result).toEqual({
        url: mockUploadResult.url,
        filename: mockUploadResult.publicId,
        size: mockUploadResult.size,
        mimeType: mockFile.mimetype,
      });

      expect(CloudinaryAdapter.prototype.upload).toHaveBeenCalledWith(mockFile.buffer, {});
    });

    it('should throw InvalidFileTypeError for disallowed file type', async () => {
      const mockFile = createMockFile({ mimetype: 'application/pdf' });

      await expect(uploadFile(mockFile, 'products')).rejects.toThrow(InvalidFileTypeError);
      await expect(uploadFile(mockFile, 'products')).rejects.toThrow(
        'File type application/pdf is not allowed'
      );

      // Should not call CloudinaryAdapter
      expect(CloudinaryAdapter.prototype.upload).not.toHaveBeenCalled();
    });

    it('should throw FileTooLargeError for oversized file', async () => {
      const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10);
      const oversizeBytes = maxSizeMB * 1024 * 1024 + 1;
      const mockFile = createMockFile({ size: oversizeBytes });

      await expect(uploadFile(mockFile, 'products')).rejects.toThrow(FileTooLargeError);
      await expect(uploadFile(mockFile, 'products')).rejects.toThrow(
        `File size exceeds maximum allowed size of ${maxSizeMB} MB`
      );

      // Should not call CloudinaryAdapter
      expect(CloudinaryAdapter.prototype.upload).not.toHaveBeenCalled();
    });

    it('should throw UploadFailedError when CloudinaryAdapter fails', async () => {
      const mockFile = createMockFile();
      const uploadError = new UploadFailedError('Network timeout');

      (CloudinaryAdapter.prototype.upload as jest.Mock).mockRejectedValue(uploadError);

      await expect(uploadFile(mockFile, 'products')).rejects.toThrow(UploadFailedError);
      await expect(uploadFile(mockFile, 'products')).rejects.toThrow('File upload failed: Network timeout');
    });

    it('should throw error for invalid folder format', async () => {
      const mockFile = createMockFile();

      await expect(uploadFile(mockFile, 'invalid/folder')).rejects.toThrow(
        'folder must contain only letters, numbers, and hyphens'
      );

      // Should not call CloudinaryAdapter
      expect(CloudinaryAdapter.prototype.upload).not.toHaveBeenCalled();
    });

    it('should handle folder exceeding max length', async () => {
      const mockFile = createMockFile();
      const longFolder = 'a'.repeat(51);

      await expect(uploadFile(mockFile, longFolder)).rejects.toThrow('folder exceeds 50 characters');

      // Should not call CloudinaryAdapter
      expect(CloudinaryAdapter.prototype.upload).not.toHaveBeenCalled();
    });
  });
});
