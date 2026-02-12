import { InvalidProductDataError } from '../../domain/errors/ProductError';
import { validateSlug as sharedValidateSlug, validateUUID as sharedValidateUUID } from './shared';

export interface LocalizedText {
  es: string;
  en?: string;
  [key: string]: string | undefined;
}

export interface CreateProductInput {
  title: LocalizedText;
  description: LocalizedText;
  slug: string;
  price: number;
  compareAtPrice?: number;
  availableSizes?: string[];
  productTypeId: string;
  color: string;
  isActive?: boolean;
  isHot?: boolean;
}

export interface ValidatedCreateProductInput {
  title: LocalizedText;
  description: LocalizedText;
  slug: string;
  price: number;
  compareAtPrice?: number;
  availableSizes?: string[];
  productTypeId: string;
  color: string;
  isActive: boolean;
  isHot: boolean;
  salesCount: number;
  viewCount: number;
}

export interface UpdateProductInput {
  title?: LocalizedText;
  description?: LocalizedText;
  slug?: string;
  price?: number;
  compareAtPrice?: number;
  availableSizes?: string[];
  color?: string;
  isActive?: boolean;
  isHot?: boolean;
}

export interface ValidatedUpdateProductInput {
  title?: LocalizedText;
  description?: LocalizedText;
  slug?: string;
  price?: number;
  compareAtPrice?: number;
  availableSizes?: string[];
  color?: string;
  isActive?: boolean;
  isHot?: boolean;
}

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_COLOR_LENGTH = 50;

function validateLocalizedText(text: unknown, fieldName: string, maxLength: number): LocalizedText {
  if (!text || typeof text !== 'object' || Array.isArray(text)) {
    throw new InvalidProductDataError(`${fieldName} must be an object`, fieldName);
  }

  const textObj = text as Record<string, unknown>;

  if (!textObj.es) {
    throw new InvalidProductDataError(`${fieldName} must include Spanish translation (es)`, fieldName);
  }

  for (const [key, value] of Object.entries(textObj)) {
    if (typeof value !== 'string') {
      throw new InvalidProductDataError(`${fieldName}.${key} must be a string`, fieldName);
    }

    if (value.trim() === '') {
      throw new InvalidProductDataError(`${fieldName}.${key} cannot be empty`, fieldName);
    }

    if (value.length > maxLength) {
      throw new InvalidProductDataError(`${fieldName}.${key} exceeds ${maxLength} characters`, fieldName);
    }
  }

  return textObj as LocalizedText;
}

function throwProductError(message: string, field: string): never {
  throw new InvalidProductDataError(message, field);
}

export function validateSlug(slug: unknown, fieldName: string, required: boolean = true): string {
  return sharedValidateSlug(slug, fieldName, required, throwProductError);
}

function validatePrice(price: unknown, fieldName: string, required: boolean = true): number {
  if (price === undefined || price === null) {
    if (required) {
      throw new InvalidProductDataError('Price is required', fieldName);
    }
    throw new InvalidProductDataError('Price must be a number', fieldName);
  }

  if (typeof price !== 'number') {
    throw new InvalidProductDataError('Price must be a number', fieldName);
  }

  if (price <= 0) {
    throw new InvalidProductDataError('Price must be greater than 0', fieldName);
  }

  const decimalPlaces = (price.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    throw new InvalidProductDataError('Price cannot have more than 2 decimal places', fieldName);
  }

  return price;
}

function validateCompareAtPrice(price: number | undefined, compareAtPrice: unknown, fieldName: string): number | undefined {
  if (compareAtPrice === undefined) {
    return undefined;
  }

  if (typeof compareAtPrice !== 'number') {
    throw new InvalidProductDataError('Compare at price must be a number', fieldName);
  }

  if (compareAtPrice <= 0) {
    throw new InvalidProductDataError('Compare at price must be greater than 0', fieldName);
  }

  const decimalPlaces = (compareAtPrice.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    throw new InvalidProductDataError('Compare at price cannot have more than 2 decimal places', fieldName);
  }

  if (price !== undefined && compareAtPrice <= price) {
    throw new InvalidProductDataError('Compare at price must be greater than price', fieldName);
  }

  return compareAtPrice;
}

function validateAvailableSizes(sizes: unknown, fieldName: string): string[] | undefined {
  if (sizes === undefined) {
    return undefined;
  }

  if (!Array.isArray(sizes)) {
    throw new InvalidProductDataError('Available sizes must be an array', fieldName);
  }

  for (const size of sizes) {
    if (typeof size !== 'string') {
      throw new InvalidProductDataError('All sizes must be strings', fieldName);
    }

    if (size.trim() === '') {
      throw new InvalidProductDataError('All sizes must be non-empty strings', fieldName);
    }
  }

  return sizes;
}

function validateUUID(id: unknown, fieldName: string): string {
  return sharedValidateUUID(id, fieldName, throwProductError);
}

function validateBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new InvalidProductDataError(`${fieldName} must be a boolean`, fieldName);
  }
  return value;
}

function validateString(value: unknown, fieldName: string, maxLength: number, required: boolean): string {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    if (required) {
      throw new InvalidProductDataError(`${fieldName} is required`, fieldName);
    }
    throw new InvalidProductDataError(`${fieldName} cannot be empty`, fieldName);
  }

  if (typeof value !== 'string') {
    throw new InvalidProductDataError(`${fieldName} must be a string`, fieldName);
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length > maxLength) {
    throw new InvalidProductDataError(`${fieldName} exceeds ${maxLength} characters`, fieldName);
  }

  return trimmedValue;
}

export function validateCreateProductInput(input: CreateProductInput): ValidatedCreateProductInput {
  const title = validateLocalizedText(input.title, 'Title', MAX_TITLE_LENGTH);
  const description = validateLocalizedText(input.description, 'Description', MAX_DESCRIPTION_LENGTH);
  const slug = validateSlug(input.slug, 'slug');
  const price = validatePrice(input.price, 'price');
  const compareAtPrice = validateCompareAtPrice(price, input.compareAtPrice, 'compareAtPrice');
  const availableSizes = validateAvailableSizes(input.availableSizes, 'availableSizes');
  const productTypeId = validateUUID(input.productTypeId, 'productTypeId');
  const color = validateString(input.color, 'Color', MAX_COLOR_LENGTH, true);
  const isActive = input.isActive !== undefined ? validateBoolean(input.isActive, 'isActive') : true;
  const isHot = input.isHot !== undefined ? validateBoolean(input.isHot, 'isHot') : false;

  return {
    title,
    description,
    slug,
    price,
    compareAtPrice,
    availableSizes,
    productTypeId,
    color,
    isActive,
    isHot,
    salesCount: 0,
    viewCount: 0,
  };
}

export function validateUpdateProductInput(input: UpdateProductInput): ValidatedUpdateProductInput {
  const validated: ValidatedUpdateProductInput = {};

  if (input.title !== undefined) {
    validated.title = validateLocalizedText(input.title, 'Title', MAX_TITLE_LENGTH);
  }

  if (input.description !== undefined) {
    validated.description = validateLocalizedText(input.description, 'Description', MAX_DESCRIPTION_LENGTH);
  }

  if (input.slug !== undefined) {
    validated.slug = validateSlug(input.slug, 'slug', false);
  }

  if (input.price !== undefined) {
    validated.price = validatePrice(input.price, 'price', false);
  }

  if (input.compareAtPrice !== undefined) {
    // Only validate format/range here. Cross-validation against actual price
    // happens in the service layer where we have access to the existing product.
    validated.compareAtPrice = validateCompareAtPrice(validated.price, input.compareAtPrice, 'compareAtPrice');
  }

  if (input.availableSizes !== undefined) {
    validated.availableSizes = validateAvailableSizes(input.availableSizes, 'availableSizes');
  }

  if (input.color !== undefined) {
    validated.color = validateString(input.color, 'Color', MAX_COLOR_LENGTH, false);
  }

  if (input.isActive !== undefined) {
    validated.isActive = validateBoolean(input.isActive, 'isActive');
  }

  if (input.isHot !== undefined) {
    validated.isHot = validateBoolean(input.isHot, 'isHot');
  }

  return validated;
}

export function validateProductId(id: string): string {
  return validateUUID(id, 'id');
}
