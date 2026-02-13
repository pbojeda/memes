import {
  UploadError,
  InvalidFileTypeError,
  FileTooLargeError,
  UploadFailedError,
} from './UploadError';

describe('UploadError', () => {
  describe('InvalidFileTypeError', () => {
    it('should create error with correct properties', () => {
      const error = new InvalidFileTypeError('image/svg+xml');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UploadError);
      expect(error.name).toBe('InvalidFileTypeError');
      expect(error.code).toBe('INVALID_FILE_TYPE');
      expect(error.message).toBe('File type image/svg+xml is not allowed');
    });

    it('should include custom message if provided', () => {
      const customMessage = 'Custom error message';
      const error = new InvalidFileTypeError('image/svg+xml', customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe('INVALID_FILE_TYPE');
    });
  });

  describe('FileTooLargeError', () => {
    it('should create error with correct properties', () => {
      const error = new FileTooLargeError(10);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UploadError);
      expect(error.name).toBe('FileTooLargeError');
      expect(error.code).toBe('FILE_TOO_LARGE');
      expect(error.message).toBe('File size exceeds maximum allowed size of 10 MB');
    });

    it('should include custom message if provided', () => {
      const customMessage = 'Custom error message';
      const error = new FileTooLargeError(5, customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe('FILE_TOO_LARGE');
    });
  });

  describe('UploadFailedError', () => {
    it('should create error with correct properties', () => {
      const error = new UploadFailedError('Network timeout');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UploadError);
      expect(error.name).toBe('UploadFailedError');
      expect(error.code).toBe('UPLOAD_FAILED');
      expect(error.message).toBe('File upload failed: Network timeout');
    });

    it('should use default message if reason not provided', () => {
      const error = new UploadFailedError();

      expect(error.message).toBe('File upload failed');
      expect(error.code).toBe('UPLOAD_FAILED');
    });
  });

  describe('UploadError base class', () => {
    it('should create error with correct properties', () => {
      const error = new UploadError('Test message', 'TEST_CODE');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('UploadError');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
    });
  });
});
