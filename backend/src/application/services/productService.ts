import prisma from '../../lib/prisma';
import {
  validateCreateProductInput,
  validateUpdateProductInput,
  validateProductId,
  validateSlug,
  type CreateProductInput,
  type UpdateProductInput,
} from '../validators/productValidator';
import {
  ProductNotFoundError,
  ProductSlugAlreadyExistsError,
  InvalidProductDataError,
} from '../../domain/errors/ProductError';
import type { Product } from '../../generated/prisma/client';
import { Prisma } from '../../generated/prisma/client';

/**
 * Creates a new product.
 * @throws {InvalidProductDataError} If input validation fails
 * @throws {ProductSlugAlreadyExistsError} If slug already exists
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const validated = validateCreateProductInput(input);

  try {
    const product = await prisma.product.create({
      data: {
        title: validated.title,
        description: validated.description,
        slug: validated.slug,
        price: validated.price,
        compareAtPrice: validated.compareAtPrice,
        availableSizes: validated.availableSizes,
        productTypeId: validated.productTypeId,
        color: validated.color,
        isActive: validated.isActive,
        isHot: validated.isHot,
        salesCount: validated.salesCount,
        viewCount: validated.viewCount,
      },
    });

    return product;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ProductSlugAlreadyExistsError();
    }
    throw error;
  }
}

/**
 * Retrieves a product by ID.
 * @param includeSoftDeleted Whether to include soft-deleted products (default: false)
 * @throws {InvalidProductDataError} If ID is invalid
 * @throws {ProductNotFoundError} If product not found
 */
export async function getProductById(id: string, includeSoftDeleted: boolean = false): Promise<Product> {
  validateProductId(id);

  const where: Prisma.ProductWhereInput = {
    id,
    ...(includeSoftDeleted ? {} : { deletedAt: null }),
  };

  const product = await prisma.product.findFirst({
    where,
  });

  if (!product) {
    throw new ProductNotFoundError();
  }

  return product;
}

/**
 * Retrieves a product by slug (excludes soft-deleted products).
 * @throws {InvalidProductDataError} If slug is invalid
 * @throws {ProductNotFoundError} If product not found
 */
export async function getProductBySlug(slug: string): Promise<Product> {
  const validatedSlug = validateSlug(slug, 'slug');

  const product = await prisma.product.findFirst({
    where: {
      slug: validatedSlug,
      deletedAt: null,
    },
  });

  if (!product) {
    throw new ProductNotFoundError();
  }

  return product;
}

/**
 * Updates a product.
 * Creates a PriceHistory entry if price changes.
 * @param changedByUserId User who changed the price (optional)
 * @param reason Reason for price change (optional)
 * @throws {InvalidProductDataError} If input validation fails
 * @throws {ProductNotFoundError} If product not found
 * @throws {ProductSlugAlreadyExistsError} If slug already exists for another product
 */
export async function updateProduct(
  id: string,
  input: UpdateProductInput,
  changedByUserId?: string,
  reason?: string
): Promise<Product> {
  validateProductId(id);
  const validated = validateUpdateProductInput(input);

  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new ProductNotFoundError();
  }

  // Cross-validate compareAtPrice against actual price (existing or new)
  if (validated.compareAtPrice !== undefined) {
    const effectivePrice = validated.price ?? Number(existing.price);
    if (validated.compareAtPrice <= effectivePrice) {
      throw new InvalidProductDataError('Compare at price must be greater than price', 'compareAtPrice');
    }
  }

  // Check if price is changing (use Decimal comparison to avoid floating-point issues)
  const priceChanged = validated.price !== undefined && !existing.price.equals(validated.price);

  try {
    if (priceChanged) {
      // Use transaction to ensure atomicity of product update + price history creation
      const updatedProduct = await prisma.$transaction(async (tx) => {
        const updated = await tx.product.update({
          where: { id },
          data: validated,
        });

        await tx.priceHistory.create({
          data: {
            productId: id,
            price: validated.price!,
            changedByUserId: changedByUserId || null,
            reason: reason || null,
          },
        });

        return updated;
      });

      return updatedProduct;
    } else {
      // No price change, simple update
      const product = await prisma.product.update({
        where: { id },
        data: validated,
      });

      return product;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ProductSlugAlreadyExistsError();
    }
    throw error;
  }
}

/**
 * Soft deletes a product (sets deletedAt timestamp).
 * @throws {InvalidProductDataError} If ID is invalid
 * @throws {ProductNotFoundError} If product not found or already deleted
 */
export async function softDeleteProduct(id: string): Promise<void> {
  validateProductId(id);

  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new ProductNotFoundError();
  }

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Restores a soft-deleted product (clears deletedAt timestamp).
 * @throws {InvalidProductDataError} If ID is invalid
 * @throws {ProductNotFoundError} If product not found or not deleted
 */
export async function restoreProduct(id: string): Promise<Product> {
  validateProductId(id);

  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: { not: null } },
  });

  if (!existing) {
    throw new ProductNotFoundError();
  }

  const product = await prisma.product.update({
    where: { id },
    data: { deletedAt: null },
  });

  return product;
}
