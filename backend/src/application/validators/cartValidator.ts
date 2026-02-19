import { InvalidCartDataError } from '../../domain/errors/CartError';
import { validateUUID as sharedValidateUUID } from './shared';

export interface CartItemInput {
  productId: string;
  quantity: number;
  size?: string;
}

export interface CartValidationInput {
  items: CartItemInput[];
}

export interface ValidatedCartItem {
  productId: string;
  quantity: number;
  size?: string;
}

export interface ValidatedCartInput {
  items: ValidatedCartItem[];
}

const MAX_CART_ITEMS = 50;
const MAX_QUANTITY_PER_ITEM = 99;
const MAX_SIZE_LENGTH = 20;

// ---- Private helpers ----

function throwCartError(message: string, field: string): never {
  throw new InvalidCartDataError(message, field);
}

function validateUUID(id: unknown, fieldName: string): string {
  return sharedValidateUUID(id, fieldName, throwCartError);
}

function validateQuantity(value: unknown, fieldName: string): number {
  if (value === undefined || value === null || typeof value !== 'number') {
    throwCartError(`${fieldName} is required and must be a number`, fieldName);
  }
  const num = value as number;
  if (!Number.isInteger(num)) {
    throwCartError(`${fieldName} must be an integer`, fieldName);
  }
  if (num < 1) {
    throwCartError(`${fieldName} must be at least 1`, fieldName);
  }
  if (num > MAX_QUANTITY_PER_ITEM) {
    throwCartError(`${fieldName} cannot exceed ${MAX_QUANTITY_PER_ITEM}`, fieldName);
  }
  return num;
}

function validateOptionalSize(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throwCartError(`${fieldName} must be a string`, fieldName);
  }
  const trimmed = (value as string).trim();
  if (trimmed === '') {
    throwCartError(`${fieldName} cannot be empty`, fieldName);
  }
  if (trimmed.length > MAX_SIZE_LENGTH) {
    throwCartError(`${fieldName} cannot exceed ${MAX_SIZE_LENGTH} characters`, fieldName);
  }
  return trimmed;
}

// ---- Exported function ----

export function validateCartInput(input: CartValidationInput): ValidatedCartInput {
  const raw = input as unknown as Record<string, unknown>;

  if (!Array.isArray(raw.items)) {
    throwCartError('items must be a non-empty array', 'items');
  }

  const items = raw.items as unknown[];

  if (items.length === 0) {
    throwCartError('items array cannot be empty', 'items');
  }

  if (items.length > MAX_CART_ITEMS) {
    throwCartError(`items array cannot exceed ${MAX_CART_ITEMS} items`, 'items');
  }

  const validatedItems: ValidatedCartItem[] = items.map((item, index) => {
    const rawItem = item as Record<string, unknown>;
    const productId = validateUUID(rawItem.productId, `items[${index}].productId`);
    const quantity = validateQuantity(rawItem.quantity, `items[${index}].quantity`);
    const size = validateOptionalSize(rawItem.size, `items[${index}].size`);

    const result: ValidatedCartItem = { productId, quantity };
    if (size !== undefined) result.size = size;
    return result;
  });

  return { items: validatedItems };
}
