import prisma from '../../lib/prisma';
import {
  validateCreateProductImageInput,
  validateUpdateProductImageInput,
  type CreateProductImageInput,
  type UpdateProductImageInput,
} from '../validators/productImageValidator';
import { validateUUID } from '../validators/shared';
import {
  ProductImageNotFoundError,
  InvalidProductImageDataError,
} from '../../domain/errors/ProductImageError';
import { getProductById } from './productService';
import { CloudinaryAdapter } from '../../infrastructure/storage/CloudinaryAdapter';
import logger from '../../lib/logger';
import type { ProductImage } from '../../generated/prisma/client';

/**
 * Lists all images for a product, sorted by sortOrder then createdAt.
 * @param productId - Product UUID
 * @returns Array of product images (can be empty)
 * @throws {InvalidProductImageDataError} If productId is invalid
 */
export async function listProductImages(productId: string): Promise<ProductImage[]> {
  function throwError(message: string, field: string): never {
    throw new InvalidProductImageDataError(message, field);
  }

  validateUUID(productId, 'productId', throwError);

  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return images;
}

/**
 * Adds a new image to a product.
 * If isPrimary=true, unsets existing primary in a transaction.
 * @param productId - Product UUID
 * @param input - Image data
 * @returns Created product image
 * @throws {InvalidProductImageDataError} If validation fails
 * @throws {ProductNotFoundError} If product not found or soft-deleted
 */
export async function addProductImage(
  productId: string,
  input: CreateProductImageInput
): Promise<ProductImage> {
  function throwError(message: string, field: string): never {
    throw new InvalidProductImageDataError(message, field);
  }

  validateUUID(productId, 'productId', throwError);
  const validated = validateCreateProductImageInput(input);

  // Verify product exists and is not soft-deleted
  await getProductById(productId, false);

  // If isPrimary=true, use transaction to unset existing primary
  if (validated.isPrimary) {
    return await prisma.$transaction(async (tx) => {
      // Unset existing primary
      await tx.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });

      // Create new image
      return await tx.productImage.create({
        data: {
          productId,
          url: validated.url,
          altText: validated.altText,
          isPrimary: validated.isPrimary,
          sortOrder: validated.sortOrder,
        },
      });
    });
  }

  // Simple create if not primary
  return await prisma.productImage.create({
    data: {
      productId,
      url: validated.url,
      altText: validated.altText,
      isPrimary: validated.isPrimary,
      sortOrder: validated.sortOrder,
    },
  });
}

/**
 * Updates a product image.
 * If isPrimary=true, unsets existing primary in a transaction.
 * @param productId - Product UUID
 * @param imageId - Image UUID
 * @param input - Updated image data
 * @returns Updated product image
 * @throws {InvalidProductImageDataError} If validation fails
 * @throws {ProductImageNotFoundError} If image not found or doesn't belong to product
 */
export async function updateProductImage(
  productId: string,
  imageId: string,
  input: UpdateProductImageInput
): Promise<ProductImage> {
  function throwError(message: string, field: string): never {
    throw new InvalidProductImageDataError(message, field);
  }

  validateUUID(productId, 'productId', throwError);
  validateUUID(imageId, 'imageId', throwError);
  const validated = validateUpdateProductImageInput(input);

  // Verify image exists and belongs to product
  const existing = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });

  if (!existing) {
    throw new ProductImageNotFoundError();
  }

  // If setting isPrimary=true, use transaction to unset existing primary
  if (validated.isPrimary === true) {
    return await prisma.$transaction(async (tx) => {
      // Unset existing primary
      await tx.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });

      // Update this image
      return await tx.productImage.update({
        where: { id: imageId },
        data: validated,
      });
    });
  }

  // Simple update
  return await prisma.productImage.update({
    where: { id: imageId },
    data: validated,
  });
}

/**
 * Deletes a product image from database and Cloudinary.
 * Cloudinary deletion is best-effort (logged but not thrown).
 * @param productId - Product UUID
 * @param imageId - Image UUID
 * @throws {InvalidProductImageDataError} If validation fails
 * @throws {ProductImageNotFoundError} If image not found or doesn't belong to product
 */
export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  function throwError(message: string, field: string): never {
    throw new InvalidProductImageDataError(message, field);
  }

  validateUUID(productId, 'productId', throwError);
  validateUUID(imageId, 'imageId', throwError);

  // Verify image exists and belongs to product
  const existing = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });

  if (!existing) {
    throw new ProductImageNotFoundError();
  }

  // Delete from database
  await prisma.productImage.delete({
    where: { id: imageId },
  });

  // Delete from Cloudinary (best-effort)
  try {
    const storageService = new CloudinaryAdapter();
    // Extract publicId from URL (format: https://res.cloudinary.com/.../memestore/folder/filename.ext)
    const urlParts = existing.url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex !== -1 && urlParts.length > uploadIndex + 1) {
      // Get everything after /upload/v{version}/ (e.g., "memestore/products/abc-123.jpg")
      const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
      // Remove extension to get publicId
      const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
      await storageService.delete(publicId);
    }
  } catch (error) {
    // Log error but don't throw (best-effort cleanup)
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error', url: existing.url }, 'Failed to delete image from Cloudinary');
  }
}
