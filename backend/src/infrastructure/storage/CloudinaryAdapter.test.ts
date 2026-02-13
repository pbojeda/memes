import { CloudinaryAdapter } from './CloudinaryAdapter';
import { UploadFailedError } from '../../domain/errors/UploadError';
import { Writable } from 'stream';

// Mock cloudinary
jest.mock('./cloudinaryConfig', () => ({
  __esModule: true,
  default: {
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

import cloudinary from './cloudinaryConfig';

describe('CloudinaryAdapter', () => {
  let adapter: CloudinaryAdapter;

  beforeEach(() => {
    adapter = new CloudinaryAdapter();
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should upload file and return result', async () => {
      const mockBuffer = Buffer.from('test file content');
      const mockResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123/memestore/products/abc-123.jpg',
        public_id: 'memestore/products/abc-123',
        bytes: 1024,
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_options, callback) => {
        const writable = new Writable({
          write(_chunk, _encoding, done) {
            done();
          },
          final(done) {
            callback(null, mockResult);
            done();
          },
        });
        return writable;
      });

      const result = await adapter.upload(mockBuffer, { folder: 'products' });

      expect(result).toEqual({
        url: mockResult.secure_url,
        publicId: mockResult.public_id,
        size: mockResult.bytes,
      });

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'memestore/products',
        }),
        expect.any(Function)
      );
    });

    it('should use default folder "misc" if not provided', async () => {
      const mockBuffer = Buffer.from('test');
      const mockResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123/memestore/misc/def-456.jpg',
        public_id: 'memestore/misc/def-456',
        bytes: 512,
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_options, callback) => {
        const writable = new Writable({
          write(_chunk, _encoding, done) {
            done();
          },
          final(done) {
            callback(null, mockResult);
            done();
          },
        });
        return writable;
      });

      await adapter.upload(mockBuffer, {});

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'memestore/misc',
        }),
        expect.any(Function)
      );
    });

    it('should throw UploadFailedError on upload failure', async () => {
      const mockBuffer = Buffer.from('test');
      const uploadError = new Error('Network error');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_options, callback) => {
        const writable = new Writable({
          write(_chunk, _encoding, done) {
            done();
          },
          final(done) {
            callback(uploadError, null);
            done();
          },
        });
        return writable;
      });

      await expect(adapter.upload(mockBuffer, { folder: 'products' })).rejects.toThrow(
        UploadFailedError
      );
    });
  });

  describe('delete', () => {
    it('should delete file from Cloudinary', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await adapter.delete('memestore/products/abc-123');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('memestore/products/abc-123');
    });

    it('should not throw error if file not found (idempotent)', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'not found' });

      await expect(adapter.delete('memestore/products/nonexistent')).resolves.not.toThrow();
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('memestore/products/nonexistent');
    });

    it('should throw UploadFailedError on delete failure', async () => {
      const deleteError = new Error('Network error');
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(deleteError);

      await expect(adapter.delete('memestore/products/abc-123')).rejects.toThrow(
        UploadFailedError
      );
    });
  });
});
