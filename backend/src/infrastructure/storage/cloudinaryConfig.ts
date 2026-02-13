import { v2 as cloudinary } from 'cloudinary';

/**
 * Configure Cloudinary from environment variables.
 * Throws error if required credentials are missing (skipped in test env).
 */
function configureCloudinary(): typeof cloudinary {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Skip validation in test environment (Cloudinary is mocked)
  if (process.env.NODE_ENV !== 'test' && (!cloudName || !apiKey || !apiSecret)) {
    throw new Error(
      'Cloudinary credentials are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'
    );
  }

  cloudinary.config({
    cloud_name: cloudName || '',
    api_key: apiKey || '',
    api_secret: apiSecret || '',
  });

  return cloudinary;
}

export default configureCloudinary();
