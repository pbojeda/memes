import {
  validateFileType,
  validateFileSize,
  validateUploadFile,
  validateFolder,
  MAX_FILE_SIZE_MB,
} from './uploadValidator';
import { InvalidFileTypeError, FileTooLargeError } from '../../domain/errors/UploadError';

describe('uploadValidator', () => {
  describe('validateFileType', () => {
    it('should pass for allowed JPEG', () => {
      expect(() => validateFileType('image/jpeg', 'file')).not.toThrow();
    });

    it('should pass for allowed PNG', () => {
      expect(() => validateFileType('image/png', 'file')).not.toThrow();
    });

    it('should pass for allowed WebP', () => {
      expect(() => validateFileType('image/webp', 'file')).not.toThrow();
    });

    it('should throw InvalidFileTypeError for SVG', () => {
      expect(() => validateFileType('image/svg+xml', 'file')).toThrow(InvalidFileTypeError);
      expect(() => validateFileType('image/svg+xml', 'file')).toThrow(
        'File type image/svg+xml is not allowed'
      );
    });

    it('should throw InvalidFileTypeError for PDF', () => {
      expect(() => validateFileType('application/pdf', 'file')).toThrow(InvalidFileTypeError);
    });

    it('should throw InvalidFileTypeError for empty mimetype', () => {
      expect(() => validateFileType('', 'file')).toThrow(InvalidFileTypeError);
    });
  });

  describe('validateFileSize', () => {
    const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

    it('should pass for file under limit', () => {
      expect(() => validateFileSize(1024, 'file')).not.toThrow();
    });

    it('should pass for file at exactly max limit', () => {
      expect(() => validateFileSize(maxSizeBytes, 'file')).not.toThrow();
    });

    it('should throw FileTooLargeError for file over limit', () => {
      const oversizeBytes = maxSizeBytes + 1;
      expect(() => validateFileSize(oversizeBytes, 'file')).toThrow(FileTooLargeError);
      expect(() => validateFileSize(oversizeBytes, 'file')).toThrow(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE_MB} MB`
      );
    });

    it('should throw FileTooLargeError for zero size', () => {
      expect(() => validateFileSize(0, 'file')).toThrow(FileTooLargeError);
    });

    it('should throw FileTooLargeError for negative size', () => {
      expect(() => validateFileSize(-100, 'file')).toThrow(FileTooLargeError);
    });
  });

  describe('validateUploadFile', () => {
    const createMockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
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
      ...overrides,
    });

    it('should pass for valid file', () => {
      const file = createMockFile();
      expect(() => validateUploadFile(file)).not.toThrow();
    });

    it('should throw InvalidFileTypeError for invalid mimetype', () => {
      const file = createMockFile({ mimetype: 'application/pdf' });
      expect(() => validateUploadFile(file)).toThrow(InvalidFileTypeError);
    });

    it('should throw FileTooLargeError for oversized file', () => {
      const oversizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024 + 1;
      const file = createMockFile({ size: oversizeBytes });
      expect(() => validateUploadFile(file)).toThrow(FileTooLargeError);
    });
  });

  describe('validateFolder', () => {
    it('should return folder for valid string', () => {
      expect(validateFolder('products', 'folder')).toBe('products');
    });

    it('should return folder for alphanumeric with hyphens', () => {
      expect(validateFolder('product-images', 'folder')).toBe('product-images');
    });

    it('should return undefined for undefined', () => {
      expect(validateFolder(undefined, 'folder')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(validateFolder('', 'folder')).toBeUndefined();
    });

    it('should throw for folder exceeding 50 chars', () => {
      const longFolder = 'a'.repeat(51);
      expect(() => validateFolder(longFolder, 'folder')).toThrow(
        'folder exceeds 50 characters'
      );
    });

    it('should throw for folder with invalid characters', () => {
      expect(() => validateFolder('product/images', 'folder')).toThrow(
        'folder must contain only letters, numbers, and hyphens'
      );
    });

    it('should throw for folder with spaces', () => {
      expect(() => validateFolder('product images', 'folder')).toThrow(
        'folder must contain only letters, numbers, and hyphens'
      );
    });

    it('should throw for non-string', () => {
      expect(() => validateFolder(123, 'folder')).toThrow('folder must be a string');
    });
  });
});
