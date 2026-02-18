import { InvalidAddressDataError } from '../../domain/errors/AddressError';
import { validateUUID as sharedValidateUUID } from './shared';

export interface CreateAddressInput {
  label?: string;
  firstName: string;
  lastName: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
  isDefault?: boolean;
}

export interface ValidatedCreateAddressInput {
  label?: string;
  firstName: string;
  lastName: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
  isDefault: boolean;
}

export interface UpdateAddressInput {
  label?: string;
  firstName?: string;
  lastName?: string;
  streetLine1?: string;
  streetLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  isDefault?: boolean;
}

export interface ValidatedUpdateAddressInput {
  label?: string;
  firstName?: string;
  lastName?: string;
  streetLine1?: string;
  streetLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  isDefault?: boolean;
}

// ---- Private helpers ----

function throwAddressError(message: string, field: string): never {
  throw new InvalidAddressDataError(message, field);
}

function validateUUID(id: unknown, fieldName: string): string {
  return sharedValidateUUID(id, fieldName, throwAddressError);
}

function validateRequiredString(value: unknown, fieldName: string, maxLength: number): string {
  if (value === undefined || value === null || typeof value !== 'string') {
    throwAddressError(`${fieldName} is required`, fieldName);
  }
  const trimmed = (value as string).trim();
  if (trimmed === '') {
    throwAddressError(`${fieldName} cannot be empty`, fieldName);
  }
  if (trimmed.length > maxLength) {
    throwAddressError(`${fieldName} exceeds ${maxLength} characters`, fieldName);
  }
  return trimmed;
}

function validateOptionalString(
  value: unknown,
  fieldName: string,
  maxLength: number
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throwAddressError(`${fieldName} must be a string`, fieldName);
  }
  const trimmed = (value as string).trim();
  if (trimmed.length > maxLength) {
    throwAddressError(`${fieldName} exceeds ${maxLength} characters`, fieldName);
  }
  return trimmed || undefined;
}

function validateCountryCode(value: unknown, fieldName: string): string {
  if (value === undefined || value === null || typeof value !== 'string') {
    throwAddressError(`${fieldName} is required`, fieldName);
  }
  const trimmed = (value as string).trim();
  if (trimmed.length !== 2) {
    throwAddressError(`${fieldName} must be exactly 2 characters (ISO 3166-1 alpha-2)`, fieldName);
  }
  return trimmed;
}

function validateBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throwAddressError(`${fieldName} must be a boolean`, fieldName);
  }
  return value as boolean;
}

// ---- Exported functions ----

export function validateCreateAddressInput(input: CreateAddressInput): ValidatedCreateAddressInput {
  const label = validateOptionalString(input.label, 'label', 50);
  const firstName = validateRequiredString(input.firstName, 'firstName', 100);
  const lastName = validateRequiredString(input.lastName, 'lastName', 100);
  const streetLine1 = validateRequiredString(input.streetLine1, 'streetLine1', 255);
  const streetLine2 = validateOptionalString(input.streetLine2, 'streetLine2', 255);
  const city = validateRequiredString(input.city, 'city', 100);
  const state = validateOptionalString(input.state, 'state', 100);
  const postalCode = validateRequiredString(input.postalCode, 'postalCode', 20);
  const countryCode = validateCountryCode(input.countryCode, 'countryCode');
  const phone = validateOptionalString(input.phone, 'phone', 20);
  const isDefault =
    input.isDefault !== undefined ? validateBoolean(input.isDefault, 'isDefault') : false;

  const result: ValidatedCreateAddressInput = {
    firstName,
    lastName,
    streetLine1,
    city,
    postalCode,
    countryCode,
    isDefault,
  };

  if (label !== undefined) result.label = label;
  if (streetLine2 !== undefined) result.streetLine2 = streetLine2;
  if (state !== undefined) result.state = state;
  if (phone !== undefined) result.phone = phone;

  return result;
}

export function validateUpdateAddressInput(
  input: UpdateAddressInput
): ValidatedUpdateAddressInput {
  const validated: ValidatedUpdateAddressInput = {};

  if (input.label !== undefined) {
    const label = validateOptionalString(input.label, 'label', 50);
    if (label !== undefined) validated.label = label;
  }
  if (input.firstName !== undefined) {
    validated.firstName = validateRequiredString(input.firstName, 'firstName', 100);
  }
  if (input.lastName !== undefined) {
    validated.lastName = validateRequiredString(input.lastName, 'lastName', 100);
  }
  if (input.streetLine1 !== undefined) {
    validated.streetLine1 = validateRequiredString(input.streetLine1, 'streetLine1', 255);
  }
  if (input.streetLine2 !== undefined) {
    const streetLine2 = validateOptionalString(input.streetLine2, 'streetLine2', 255);
    if (streetLine2 !== undefined) validated.streetLine2 = streetLine2;
  }
  if (input.city !== undefined) {
    validated.city = validateRequiredString(input.city, 'city', 100);
  }
  if (input.state !== undefined) {
    const state = validateOptionalString(input.state, 'state', 100);
    if (state !== undefined) validated.state = state;
  }
  if (input.postalCode !== undefined) {
    validated.postalCode = validateRequiredString(input.postalCode, 'postalCode', 20);
  }
  if (input.countryCode !== undefined) {
    validated.countryCode = validateCountryCode(input.countryCode, 'countryCode');
  }
  if (input.phone !== undefined) {
    const phone = validateOptionalString(input.phone, 'phone', 20);
    if (phone !== undefined) validated.phone = phone;
  }
  if (input.isDefault !== undefined) {
    validated.isDefault = validateBoolean(input.isDefault, 'isDefault');
  }

  return validated;
}

export function validateAddressId(id: string): string {
  return validateUUID(id, 'id');
}
