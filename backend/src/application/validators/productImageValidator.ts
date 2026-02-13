import { InvalidProductImageDataError } from '../../domain/errors/ProductImageError';
import type { LocalizedText } from './productValidator';

const MAX_URL_LENGTH = 500;
const MAX_ALT_TEXT_LENGTH = 200;

export interface CreateProductImageInput {
  url: string;
  altText?: LocalizedText;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ValidatedCreateProductImageInput {
  url: string;
  altText?: LocalizedText;
  isPrimary: boolean;
  sortOrder: number;
}

export interface UpdateProductImageInput {
  altText?: LocalizedText;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ValidatedUpdateProductImageInput {
  altText?: LocalizedText;
  isPrimary?: boolean;
  sortOrder?: number;
}

/**
 * Validates a URL string.
 * @param url - URL to validate
 * @param fieldName - Field name for error messages
 * @returns Validated URL string
 * @throws {InvalidProductImageDataError} If URL is invalid
 */
export function validateUrl(url: unknown, fieldName: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new InvalidProductImageDataError('URL is required', fieldName);
  }

  const trimmedUrl = url.trim();

  if (trimmedUrl.length > MAX_URL_LENGTH) {
    throw new InvalidProductImageDataError(`URL exceeds ${MAX_URL_LENGTH} characters`, fieldName);
  }

  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    throw new InvalidProductImageDataError('URL must start with http:// or https://', fieldName);
  }

  return trimmedUrl;
}

/**
 * Validates alt text (LocalizedText).
 * @param altText - Alt text to validate
 * @param fieldName - Field name for error messages
 * @returns Validated LocalizedText or undefined
 * @throws {InvalidProductImageDataError} If alt text is invalid
 */
export function validateAltText(altText: unknown, fieldName: string): LocalizedText | undefined {
  if (altText === undefined) {
    return undefined;
  }

  if (!altText || typeof altText !== 'object' || Array.isArray(altText)) {
    throw new InvalidProductImageDataError(`${fieldName} must be an object`, fieldName);
  }

  const textObj = altText as Record<string, unknown>;

  if (!textObj.es) {
    throw new InvalidProductImageDataError(
      `${fieldName} must include Spanish translation (es)`,
      fieldName
    );
  }

  for (const [key, value] of Object.entries(textObj)) {
    if (typeof value !== 'string') {
      throw new InvalidProductImageDataError(`${fieldName}.${key} must be a string`, fieldName);
    }

    if (value.trim() === '') {
      throw new InvalidProductImageDataError(`${fieldName}.${key} cannot be empty`, fieldName);
    }

    if (value.length > MAX_ALT_TEXT_LENGTH) {
      throw new InvalidProductImageDataError(
        `${fieldName}.${key} exceeds ${MAX_ALT_TEXT_LENGTH} characters`,
        fieldName
      );
    }
  }

  return textObj as LocalizedText;
}

/**
 * Validates sort order.
 * @param sortOrder - Sort order to validate
 * @param fieldName - Field name for error messages
 * @returns Validated sort order (defaults to 0 if undefined)
 * @throws {InvalidProductImageDataError} If sort order is invalid
 */
export function validateSortOrder(sortOrder: unknown, fieldName: string): number {
  if (sortOrder === undefined) {
    return 0;
  }

  if (typeof sortOrder !== 'number') {
    throw new InvalidProductImageDataError('sortOrder must be a number', fieldName);
  }

  if (sortOrder < 0) {
    throw new InvalidProductImageDataError(
      'sortOrder must be greater than or equal to 0',
      fieldName
    );
  }

  if (!Number.isInteger(sortOrder)) {
    throw new InvalidProductImageDataError('sortOrder must be an integer', fieldName);
  }

  return sortOrder;
}

/**
 * Validates isPrimary flag.
 * @param isPrimary - Flag to validate
 * @param fieldName - Field name for error messages
 * @returns Validated boolean (defaults to false if undefined)
 * @throws {InvalidProductImageDataError} If isPrimary is not a boolean
 */
function validateIsPrimary(isPrimary: unknown, fieldName: string): boolean {
  if (isPrimary === undefined) {
    return false;
  }

  if (typeof isPrimary !== 'boolean') {
    throw new InvalidProductImageDataError('isPrimary must be a boolean', fieldName);
  }

  return isPrimary;
}

/**
 * Validates input for creating a product image.
 * @param input - Input to validate
 * @returns Validated input with defaults
 * @throws {InvalidProductImageDataError} If validation fails
 */
export function validateCreateProductImageInput(
  input: CreateProductImageInput
): ValidatedCreateProductImageInput {
  const url = validateUrl(input.url, 'url');
  const altText = validateAltText(input.altText, 'altText');
  const isPrimary = validateIsPrimary(input.isPrimary, 'isPrimary');
  const sortOrder = validateSortOrder(input.sortOrder, 'sortOrder');

  return {
    url,
    altText,
    isPrimary,
    sortOrder,
  };
}

/**
 * Validates input for updating a product image.
 * @param input - Input to validate
 * @returns Validated input (only provided fields)
 * @throws {InvalidProductImageDataError} If validation fails
 */
export function validateUpdateProductImageInput(
  input: UpdateProductImageInput
): ValidatedUpdateProductImageInput {
  const validated: ValidatedUpdateProductImageInput = {};

  if (input.altText !== undefined) {
    validated.altText = validateAltText(input.altText, 'altText');
  }

  if (input.isPrimary !== undefined) {
    validated.isPrimary = validateIsPrimary(input.isPrimary, 'isPrimary');
  }

  if (input.sortOrder !== undefined) {
    validated.sortOrder = validateSortOrder(input.sortOrder, 'sortOrder');
  }

  return validated;
}
