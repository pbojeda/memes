import prisma from '../../lib/prisma';
import { validateCartInput, type CartValidationInput } from '../validators/cartValidator';
import type { Prisma, ProductImage } from '../../generated/prisma/client';

type CartItemErrorCode =
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_INACTIVE'
  | 'INVALID_SIZE'
  | 'SIZE_REQUIRED'
  | 'SIZE_NOT_ALLOWED';

interface CartItemError {
  productId: string;
  code: CartItemErrorCode;
  message: string;
}

interface ValidatedCartItemResult {
  productId: string;
  quantity: number;
  size: string | null;
  unitPrice: number;
  subtotal: number;
  product: {
    title: Prisma.JsonValue;
    slug: string;
    primaryImage: ProductImage | null;
  };
  status: 'valid';
}

export interface CartValidationResult {
  valid: boolean;
  items: ValidatedCartItemResult[];
  summary: {
    subtotal: number;
    itemCount: number;
  };
  errors: CartItemError[];
}

/**
 * Validates a list of cart items against the current product catalog.
 * Batch-loads all products in one query without isActive/deletedAt filter
 * to distinguish PRODUCT_NOT_FOUND from PRODUCT_INACTIVE errors.
 *
 * @throws {InvalidCartDataError} If input validation fails
 */
export async function validateCart(input: CartValidationInput): Promise<CartValidationResult> {
  const validated = validateCartInput(input);

  const uniqueProductIds = [...new Set(validated.items.map((item) => item.productId))];

  const products = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds } },
    include: {
      productType: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const validItems: ValidatedCartItemResult[] = [];
  const errors: CartItemError[] = [];

  for (const item of validated.items) {
    const product = productMap.get(item.productId);

    if (!product) {
      errors.push({
        productId: item.productId,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
      continue;
    }

    if (!product.isActive || product.deletedAt !== null) {
      errors.push({
        productId: item.productId,
        code: 'PRODUCT_INACTIVE',
        message: 'Product is no longer available',
      });
      continue;
    }

    const hasSizes = product.productType.hasSizes;
    const availableSizes = product.availableSizes as string[] | null;

    if (hasSizes && !item.size) {
      errors.push({
        productId: item.productId,
        code: 'SIZE_REQUIRED',
        message: 'A size is required for this product',
      });
      continue;
    }

    if (!hasSizes && item.size) {
      errors.push({
        productId: item.productId,
        code: 'SIZE_NOT_ALLOWED',
        message: 'This product does not have sizes',
      });
      continue;
    }

    if (hasSizes && item.size) {
      if (!availableSizes || availableSizes.length === 0 || !availableSizes.includes(item.size)) {
        errors.push({
          productId: item.productId,
          code: 'INVALID_SIZE',
          message: 'Selected size is not available for this product',
        });
        continue;
      }
    }

    const unitPrice = Number(product.price);
    const rawSubtotal = unitPrice * item.quantity;
    const subtotal = Math.round(rawSubtotal * 100) / 100;

    validItems.push({
      productId: item.productId,
      quantity: item.quantity,
      size: item.size ?? null,
      unitPrice,
      subtotal,
      product: {
        title: product.title,
        slug: product.slug,
        primaryImage: (product.images ?? [])[0] ?? null,
      },
      status: 'valid',
    });
  }

  const rawSummarySubtotal = validItems.reduce((sum, i) => sum + i.subtotal, 0);
  const summarySubtotal = Math.round(rawSummarySubtotal * 100) / 100;
  const summaryItemCount = validItems.reduce((sum, i) => sum + i.quantity, 0);

  return {
    valid: errors.length === 0,
    items: validItems,
    summary: {
      subtotal: summarySubtotal,
      itemCount: summaryItemCount,
    },
    errors,
  };
}
