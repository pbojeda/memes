import multer from 'multer';

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10);

/**
 * Multer middleware configured with memory storage.
 * Files are stored as buffers (not written to disk).
 * File size is limited at the middleware level to prevent memory exhaustion.
 */
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});
