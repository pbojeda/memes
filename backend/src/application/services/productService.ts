import prisma from '../../lib/prisma';
import { generateSlug } from '../../utils/slugify';
import {
  validateCreateProductInput,
  validateUpdateProductInput,
  validateProductId,
  validateSlug,
  validateListProductsInput,
  type CreateProductInput,
  type UpdateProductInput,
  type ListProductsInput,
} from '../validators/productValidator';
import {
  ProductNotFoundError,
  ProductSlugAlreadyExistsError,
  InvalidProductDataError,
} from '../../domain/errors/ProductError';
import type { Product, ProductImage, ProductReview, ProductType } from '../../generated/prisma/client';
import { Prisma } from '../../generated/prisma/client';
import type { PaginationMeta } from '../../utils/responseHelpers';

/**
 * Creates a new product.
 * When slug is not provided, auto-generates it from title.es.
 * On slug collision (P2002), retries with numeric suffix up to MAX_SLUG_RETRIES times.
 *
 * @throws {InvalidProductDataError} If input validation fails
 * @throws {ProductSlugAlreadyExistsError} If slug collides after all retries are exhausted
 */
const MAX_SLUG_RETRIES = 10;
const MAX_SLUG_LENGTH = 100;
const MAX_SLUG_BASE_LENGTH = MAX_SLUG_LENGTH - `-${MAX_SLUG_RETRIES}`.length;

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const validated = validateCreateProductInput(input);

  // Explicit slug: use as-is (already validated to <= 100 chars)
  // Auto-generated slug: truncate to leave room for collision suffixes (-1..-10)
  const baseSlug = validated.slug
    ?? generateSlug(validated.title.es).substring(0, MAX_SLUG_BASE_LENGTH).replace(/-$/, '');

  for (let attempt = 0; attempt <= MAX_SLUG_RETRIES; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;

    try {
      const product = await prisma.product.create({
        data: {
          title: validated.title,
          description: validated.description,
          slug,
          price: validated.price,
          compareAtPrice: validated.compareAtPrice,
          availableSizes: validated.availableSizes,
          productTypeId: validated.productTypeId,
          color: validated.color,
          isActive: validated.isActive,
          isHot: validated.isHot,
          salesCount: validated.salesCount,
          viewCount: validated.viewCount,
          createdByUserId: validated.createdByUserId ?? null,
        },
      });

      return product;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[] | undefined) ?? [];
        if (!target.includes('slug')) {
          throw error;
        }
        if (attempt === MAX_SLUG_RETRIES) {
          throw new ProductSlugAlreadyExistsError();
        }
        continue;
      }
      throw error;
    }
  }

  // TypeScript requires an explicit throw here (unreachable at runtime)
  throw new ProductSlugAlreadyExistsError();
}

/**
 * Retrieves a product by ID.
 * @param includeSoftDeleted Whether to include soft-deleted products (default: false)
 * @throws {InvalidProductDataError} If ID is invalid
 * @throws {ProductNotFoundError} If product not found
 */
export async function getProductById(id: string, includeSoftDeleted: boolean = false): Promise<ProductWithType> {
  validateProductId(id);

  const where: Prisma.ProductWhereInput = {
    id,
    ...(includeSoftDeleted ? {} : { deletedAt: null }),
  };

  const product = await prisma.product.findFirst({
    where,
    include: { productType: true },
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
export async function getProductBySlug(slug: string): Promise<ProductWithType> {
  const validatedSlug = validateSlug(slug, 'slug');

  const product = await prisma.product.findFirst({
    where: {
      slug: validatedSlug,
      deletedAt: null,
    },
    include: { productType: true },
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

export type ProductWithType = Product & {
  productType: ProductType;
};

export type ProductWithPrimaryImage = Product & {
  primaryImage?: ProductImage;
};

export interface ListProductsResult {
  data: ProductWithPrimaryImage[];
  pagination: PaginationMeta;
}

/**
 * Retrieves a product by slug with images and reviews (public endpoint).
 * Increments viewCount asynchronously (fire-and-forget).
 * @throws {InvalidProductDataError} If slug is invalid
 * @throws {ProductNotFoundError} If product not found or soft-deleted
 */
export async function getProductDetailBySlug(slug: string): Promise<Product & { images: ProductImage[]; reviews: ProductReview[] }> {
  const validatedSlug = validateSlug(slug, 'slug');

  const product = await prisma.product.findFirst({
    where: {
      slug: validatedSlug,
      deletedAt: null,
    },
    include: {
      images: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
      reviews: {
        where: { isVisible: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!product) {
    throw new ProductNotFoundError();
  }

  // Fire-and-forget viewCount increment (non-blocking)
  prisma.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {
    // Silently ignore errors to avoid crashing the request
  });

  return product;
}

/**
 * Lists products with pagination, filtering, and sorting.
 * @param input Filtering, pagination, and sorting options
 * @throws {InvalidProductDataError} If input validation fails
 * @returns Paginated list of products with metadata
 */
export async function listProducts(input: ListProductsInput): Promise<ListProductsResult> {
  const validated = validateListProductsInput(input);

  // Build where clause dynamically
  const where: Prisma.ProductWhereInput = {};

  // Soft-delete filter (default: exclude deleted)
  if (!validated.includeSoftDeleted) {
    where.deletedAt = null;
  }

  // Product type filter
  if (validated.productTypeId) {
    where.productTypeId = validated.productTypeId;
  }

  // Active status filter
  if (validated.isActive !== undefined) {
    where.isActive = validated.isActive;
  }

  // Hot status filter
  if (validated.isHot !== undefined) {
    where.isHot = validated.isHot;
  }

  // Price range filter
  if (validated.minPrice !== undefined || validated.maxPrice !== undefined) {
    where.price = {};
    if (validated.minPrice !== undefined) {
      where.price.gte = validated.minPrice;
    }
    if (validated.maxPrice !== undefined) {
      where.price.lte = validated.maxPrice;
    }
  }

  // Search text filter (JSONB title.es and title.en)
  if (validated.search) {
    where.OR = [
      {
        title: {
          path: ['es'],
          string_contains: validated.search,
          mode: 'insensitive',
        },
      },
      {
        title: {
          path: ['en'],
          string_contains: validated.search,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Pagination
  const skip = (validated.page - 1) * validated.limit;
  const take = validated.limit;

  // Sorting
  const orderBy: Prisma.ProductOrderByWithRelationInput = {
    [validated.sortBy]: validated.sortDirection,
  };

  // Execute queries
  const [rawProducts, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        productType: true,
      },
    }),
    prisma.product.count({
      where,
    }),
  ]);

  // Map raw products: extract primaryImage from images array, remove images field
  const products: ProductWithPrimaryImage[] = rawProducts.map(({ images, ...product }) => ({
    ...product,
    primaryImage: (images ?? [])[0],
  }));

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / validated.limit);

  return {
    data: products,
    pagination: {
      page: validated.page,
      limit: validated.limit,
      total,
      totalPages,
      hasNext: validated.page < totalPages,
      hasPrev: validated.page > 1,
    },
  };
}
