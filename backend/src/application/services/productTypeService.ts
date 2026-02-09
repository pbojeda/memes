import prisma from '../../lib/prisma';
import {
  validateCreateProductTypeInput,
  validateUpdateProductTypeInput,
  validateGetAllProductTypesInput,
  validateProductTypeId,
  type CreateProductTypeInput,
  type UpdateProductTypeInput,
  type GetAllProductTypesInput,
} from '../validators/productTypeValidator';
import {
  ProductTypeNotFoundError,
  ProductTypeSlugAlreadyExistsError,
} from '../../domain/errors/ProductTypeError';
import type { ProductType } from '../../generated/prisma/client';
import { Prisma } from '../../generated/prisma/client';

/**
 * Creates a new product type.
 * @throws {InvalidProductTypeDataError} If input validation fails
 * @throws {ProductTypeSlugAlreadyExistsError} If slug already exists
 */
export async function createProductType(input: CreateProductTypeInput): Promise<ProductType> {
  const validated = validateCreateProductTypeInput(input);

  const existing = await prisma.productType.findUnique({
    where: { slug: validated.slug },
  });

  if (existing) {
    throw new ProductTypeSlugAlreadyExistsError();
  }

  const productType = await prisma.productType.create({
    data: {
      name: validated.name,
      slug: validated.slug,
      hasSizes: validated.hasSizes,
      isActive: validated.isActive,
      sortOrder: validated.sortOrder,
    },
  });

  return productType;
}

/**
 * Retrieves a product type by ID.
 * @throws {InvalidProductTypeDataError} If ID is invalid
 * @throws {ProductTypeNotFoundError} If product type not found
 */
export async function getProductTypeById(id: string): Promise<ProductType> {
  validateProductTypeId(id);

  const productType = await prisma.productType.findUnique({
    where: { id },
  });

  if (!productType) {
    throw new ProductTypeNotFoundError();
  }

  return productType;
}

/**
 * Retrieves all product types with role-aware filtering.
 *
 * Role-based behavior:
 * - PUBLIC/TARGET: Only returns active product types (isActive filter ignored)
 * - ADMIN/MANAGER/MARKETING: Returns all by default, respects explicit isActive filter
 *
 * Always ordered by sortOrder ascending.
 */
export async function getAllProductTypes(input: GetAllProductTypesInput): Promise<ProductType[]> {
  const validated = validateGetAllProductTypesInput(input);

  const where: Prisma.ProductTypeWhereInput = {};

  if (validated.callerRole === 'PUBLIC' || validated.callerRole === 'TARGET') {
    where.isActive = true;
  } else {
    if (validated.isActive !== undefined) {
      where.isActive = validated.isActive;
    }
  }

  const productTypes = await prisma.productType.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });

  return productTypes;
}

/**
 * Updates a product type.
 * @throws {InvalidProductTypeDataError} If input validation fails
 * @throws {ProductTypeNotFoundError} If product type not found
 * @throws {ProductTypeSlugAlreadyExistsError} If slug already exists for another product type
 */
export async function updateProductType(id: string, input: UpdateProductTypeInput): Promise<ProductType> {
  validateProductTypeId(id);
  const validated = validateUpdateProductTypeInput(input);

  const existing = await prisma.productType.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ProductTypeNotFoundError();
  }

  if (validated.slug && validated.slug !== existing.slug) {
    const slugExists = await prisma.productType.findUnique({
      where: { slug: validated.slug },
    });

    if (slugExists) {
      throw new ProductTypeSlugAlreadyExistsError();
    }
  }

  const productType = await prisma.productType.update({
    where: { id },
    data: validated,
  });

  return productType;
}

/**
 * Deletes a product type.
 * @throws {InvalidProductTypeDataError} If ID is invalid
 * @throws {ProductTypeNotFoundError} If product type not found
 *
 * Note: Does NOT check for associated products (deferred to Sprint 3 per ADR-002)
 */
export async function deleteProductType(id: string): Promise<void> {
  validateProductTypeId(id);

  const existing = await prisma.productType.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ProductTypeNotFoundError();
  }

  await prisma.productType.delete({
    where: { id },
  });
}
