import { InvalidProductTypeDataError } from '../../domain/errors/ProductTypeError';
import type { UserRole } from '../../generated/prisma/enums';

/** Role value for unauthenticated callers. */
export const UNAUTHENTICATED_ROLE = 'PUBLIC' as const;
export type CallerRole = UserRole | typeof UNAUTHENTICATED_ROLE;

export interface LocalizedName {
  es: string;
  en?: string;
  [key: string]: string | undefined;
}

export interface CreateProductTypeInput {
  name: LocalizedName;
  slug: string;
  hasSizes?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ValidatedCreateProductTypeInput {
  name: LocalizedName;
  slug: string;
  hasSizes: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface UpdateProductTypeInput {
  name?: LocalizedName;
  slug?: string;
  hasSizes?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ValidatedUpdateProductTypeInput {
  name?: LocalizedName;
  slug?: string;
  hasSizes?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface GetAllProductTypesInput {
  isActive?: boolean;
  callerRole: CallerRole;
}

export interface ValidatedGetAllProductTypesInput {
  isActive?: boolean;
  callerRole: CallerRole;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 100;
const MAX_NAME_LENGTH = 100;
const MAX_SORT_ORDER = 2147483647;

function validateName(name: unknown, fieldName: string): LocalizedName {
  if (!name || typeof name !== 'object' || Array.isArray(name)) {
    throw new InvalidProductTypeDataError('Name must be an object', fieldName);
  }

  const nameObj = name as Record<string, unknown>;

  if (!nameObj.es) {
    throw new InvalidProductTypeDataError('Name must include Spanish translation (es)', fieldName);
  }

  for (const [key, value] of Object.entries(nameObj)) {
    if (typeof value !== 'string') {
      throw new InvalidProductTypeDataError(`Name.${key} must be a string`, fieldName);
    }

    if (value.trim() === '') {
      throw new InvalidProductTypeDataError(`Name.${key} cannot be empty`, fieldName);
    }

    if (value.length > MAX_NAME_LENGTH) {
      throw new InvalidProductTypeDataError(`Name.${key} exceeds ${MAX_NAME_LENGTH} characters`, fieldName);
    }
  }

  return nameObj as LocalizedName;
}

function validateSlug(slug: unknown, fieldName: string, required: boolean = true): string {
  if (!slug || (typeof slug === 'string' && slug.trim() === '')) {
    if (required) {
      throw new InvalidProductTypeDataError('Slug is required', fieldName);
    }
    throw new InvalidProductTypeDataError('Slug cannot be empty', fieldName);
  }

  if (typeof slug !== 'string') {
    throw new InvalidProductTypeDataError('Slug must be a string', fieldName);
  }

  const trimmedSlug = slug.trim();

  if (trimmedSlug.length > MAX_SLUG_LENGTH) {
    throw new InvalidProductTypeDataError(`Slug exceeds ${MAX_SLUG_LENGTH} characters`, fieldName);
  }

  if (trimmedSlug !== trimmedSlug.toLowerCase()) {
    throw new InvalidProductTypeDataError('Slug must be lowercase', fieldName);
  }

  if (!SLUG_REGEX.test(trimmedSlug)) {
    throw new InvalidProductTypeDataError('Slug must contain only lowercase letters, numbers, and hyphens', fieldName);
  }

  return trimmedSlug;
}

function validateBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new InvalidProductTypeDataError(`${fieldName} must be a boolean`, fieldName);
  }
  return value;
}

function validateSortOrder(value: unknown, fieldName: string): number {
  if (typeof value !== 'number') {
    throw new InvalidProductTypeDataError('Sort order must be a number', fieldName);
  }

  if (!Number.isInteger(value)) {
    throw new InvalidProductTypeDataError('Sort order must be an integer', fieldName);
  }

  if (value < 0) {
    throw new InvalidProductTypeDataError('Sort order cannot be negative', fieldName);
  }

  if (value > MAX_SORT_ORDER) {
    throw new InvalidProductTypeDataError(`Sort order cannot exceed ${MAX_SORT_ORDER}`, fieldName);
  }

  return value;
}

function validateUUID(id: unknown, fieldName: string): string {
  if (!id || typeof id !== 'string') {
    throw new InvalidProductTypeDataError('ID is required', fieldName);
  }

  if (!UUID_REGEX.test(id)) {
    throw new InvalidProductTypeDataError('Invalid ID format', fieldName);
  }

  return id;
}

export function validateCreateProductTypeInput(input: CreateProductTypeInput): ValidatedCreateProductTypeInput {
  const name = validateName(input.name, 'name');
  const slug = validateSlug(input.slug, 'slug');
  const hasSizes = input.hasSizes !== undefined ? validateBoolean(input.hasSizes, 'hasSizes') : false;
  const isActive = input.isActive !== undefined ? validateBoolean(input.isActive, 'isActive') : true;
  const sortOrder = input.sortOrder !== undefined ? validateSortOrder(input.sortOrder, 'sortOrder') : 0;

  return {
    name,
    slug,
    hasSizes,
    isActive,
    sortOrder,
  };
}

export function validateUpdateProductTypeInput(input: UpdateProductTypeInput): ValidatedUpdateProductTypeInput {
  const validated: ValidatedUpdateProductTypeInput = {};

  if (input.name !== undefined) {
    validated.name = validateName(input.name, 'name');
  }

  if (input.slug !== undefined) {
    validated.slug = validateSlug(input.slug, 'slug', false);
  }

  if (input.hasSizes !== undefined) {
    validated.hasSizes = validateBoolean(input.hasSizes, 'hasSizes');
  }

  if (input.isActive !== undefined) {
    validated.isActive = validateBoolean(input.isActive, 'isActive');
  }

  if (input.sortOrder !== undefined) {
    validated.sortOrder = validateSortOrder(input.sortOrder, 'sortOrder');
  }

  return validated;
}

export function validateGetAllProductTypesInput(input: GetAllProductTypesInput): ValidatedGetAllProductTypesInput {
  const validated: ValidatedGetAllProductTypesInput = {
    callerRole: input.callerRole,
  };

  if (input.isActive !== undefined) {
    validated.isActive = validateBoolean(input.isActive, 'isActive');
  }

  return validated;
}

export function validateProductTypeId(id: string): string {
  return validateUUID(id, 'id');
}
