import { InvalidOrderTotalDataError } from '../../domain/errors/OrderTotalError';
import { validateUUID as sharedValidateUUID } from './shared';

export interface OrderTotalItemInput {
  productId: string;
  quantity: number;
  size?: string;
}

export interface OrderTotalCalculationInput {
  items: OrderTotalItemInput[];
  promoCode?: unknown; // unknown so validator can type-check it
}

export interface ValidatedOrderTotalItem {
  productId: string;
  quantity: number;
  size?: string;
}

export interface ValidatedOrderTotalInput {
  items: ValidatedOrderTotalItem[];
  promoCode?: string;
}

const MAX_CART_ITEMS = 50;
const MAX_QUANTITY_PER_ITEM = 99;
const MAX_SIZE_LENGTH = 20;
const MAX_PROMO_CODE_LENGTH = 50;

// ---- Private helpers ----

function throwOrderTotalError(message: string, field: string): never {
  throw new InvalidOrderTotalDataError(message, field);
}

function validateUUID(id: unknown, fieldName: string): string {
  return sharedValidateUUID(id, fieldName, throwOrderTotalError);
}

function validateQuantity(value: unknown, fieldName: string): number {
  if (value === undefined || value === null || typeof value !== 'number') {
    throwOrderTotalError(`${fieldName} is required and must be a number`, fieldName);
  }
  const num = value as number;
  if (!Number.isInteger(num)) {
    throwOrderTotalError(`${fieldName} must be an integer`, fieldName);
  }
  if (num < 1) {
    throwOrderTotalError(`${fieldName} must be at least 1`, fieldName);
  }
  if (num > MAX_QUANTITY_PER_ITEM) {
    throwOrderTotalError(`${fieldName} cannot exceed ${MAX_QUANTITY_PER_ITEM}`, fieldName);
  }
  return num;
}

function validateOptionalSize(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throwOrderTotalError(`${fieldName} must be a string`, fieldName);
  }
  const trimmed = (value as string).trim();
  if (trimmed === '') {
    throwOrderTotalError(`${fieldName} cannot be empty`, fieldName);
  }
  if (trimmed.length > MAX_SIZE_LENGTH) {
    throwOrderTotalError(`${fieldName} cannot exceed ${MAX_SIZE_LENGTH} characters`, fieldName);
  }
  return trimmed;
}

function validateOptionalPromoCode(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throwOrderTotalError('promoCode must be a string', 'promoCode');
  }
  const trimmed = (value as string).trim();
  if (trimmed === '') {
    throwOrderTotalError('promoCode cannot be empty', 'promoCode');
  }
  if (trimmed.length > MAX_PROMO_CODE_LENGTH) {
    throwOrderTotalError(
      `promoCode cannot exceed ${MAX_PROMO_CODE_LENGTH} characters`,
      'promoCode'
    );
  }
  return trimmed.toUpperCase();
}

// ---- Exported function ----

export function validateOrderTotalInput(
  input: OrderTotalCalculationInput
): ValidatedOrderTotalInput {
  const raw = input as unknown as Record<string, unknown>;

  if (!Array.isArray(raw.items)) {
    throwOrderTotalError('items must be a non-empty array', 'items');
  }

  const items = raw.items as unknown[];

  if (items.length === 0) {
    throwOrderTotalError('items array cannot be empty', 'items');
  }

  if (items.length > MAX_CART_ITEMS) {
    throwOrderTotalError(`items array cannot exceed ${MAX_CART_ITEMS} items`, 'items');
  }

  const validatedItems: ValidatedOrderTotalItem[] = items.map((item, index) => {
    const rawItem = item as Record<string, unknown>;
    const productId = validateUUID(rawItem.productId, `items[${index}].productId`);
    const quantity = validateQuantity(rawItem.quantity, `items[${index}].quantity`);
    const size = validateOptionalSize(rawItem.size, `items[${index}].size`);

    const result: ValidatedOrderTotalItem = { productId, quantity };
    if (size !== undefined) result.size = size;
    return result;
  });

  const promoCode = validateOptionalPromoCode(raw.promoCode);

  const resultOutput: ValidatedOrderTotalInput = { items: validatedItems };
  if (promoCode !== undefined) resultOutput.promoCode = promoCode;
  return resultOutput;
}
