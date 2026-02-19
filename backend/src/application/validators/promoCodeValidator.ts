import { InvalidPromoCodeDataError } from '../../domain/errors/PromoCodeError';

// ---- Interfaces ----

export interface PromoCodeValidationInput {
  code: unknown;
  orderTotal?: unknown;
}

export interface ValidatedPromoCodeInput {
  code: string;
  orderTotal?: number;
}

// ---- Constants ----

const MAX_CODE_LENGTH = 50;

// ---- Private helpers ----

function throwPromoCodeError(message: string, field: string): never {
  throw new InvalidPromoCodeDataError(message, field);
}

function validateCode(value: unknown): string {
  if (value === undefined || value === null || typeof value !== 'string') {
    throwPromoCodeError('code is required and must be a string', 'code');
  }
  const trimmed = value.trim();
  if (trimmed === '') {
    throwPromoCodeError('code cannot be empty', 'code');
  }
  if (trimmed.length > MAX_CODE_LENGTH) {
    throwPromoCodeError(`code cannot exceed ${MAX_CODE_LENGTH} characters`, 'code');
  }
  return trimmed.toUpperCase();
}

function validateOrderTotal(value: unknown): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    throwPromoCodeError('orderTotal must be a number', 'orderTotal');
  }
  const num = value;
  if (num < 0) {
    throwPromoCodeError('orderTotal must be at least 0', 'orderTotal');
  }
  return num;
}

// ---- Exported function ----

export function validatePromoCodeInput(input: PromoCodeValidationInput): ValidatedPromoCodeInput {
  const code = validateCode(input.code);

  const result: ValidatedPromoCodeInput = { code };

  if (input.orderTotal !== undefined) {
    result.orderTotal = validateOrderTotal(input.orderTotal);
  }

  return result;
}
