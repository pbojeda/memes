/**
 * Address field limits matching backend requirements.
 * See: backend/src/application/validators/addressValidator.ts
 */
export const ADDRESS_FIELD_LIMITS = {
  label: 50,
  firstName: 100,
  lastName: 100,
  streetLine1: 255,
  streetLine2: 255,
  city: 100,
  state: 100,
  postalCode: 20,
  countryCode: 2,
  phone: 20,
} as const;

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

export interface AddressFormErrors {
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
}

export interface AddressFormValidationResult {
  isValid: boolean;
  errors: AddressFormErrors;
}

export interface AddressFormFields {
  label: string;
  firstName: string;
  lastName: string;
  streetLine1: string;
  streetLine2: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  phone: string;
  isDefault: boolean;
}

/**
 * Validates the first name field.
 * Required, max 100 characters.
 */
export function validateFirstName(value: string): FieldValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: false, error: 'First name is required' };
  }
  if (trimmed.length > ADDRESS_FIELD_LIMITS.firstName) {
    return { isValid: false, error: 'First name must be 100 characters or less' };
  }
  return { isValid: true };
}

/**
 * Validates the last name field.
 * Required, max 100 characters.
 */
export function validateLastName(value: string): FieldValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Last name is required' };
  }
  if (trimmed.length > ADDRESS_FIELD_LIMITS.lastName) {
    return { isValid: false, error: 'Last name must be 100 characters or less' };
  }
  return { isValid: true };
}

/**
 * Validates the primary street address line.
 * Required, max 255 characters.
 */
export function validateStreetLine1(value: string): FieldValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Street address is required' };
  }
  if (trimmed.length > ADDRESS_FIELD_LIMITS.streetLine1) {
    return { isValid: false, error: 'Street address must be 255 characters or less' };
  }
  return { isValid: true };
}

/**
 * Validates the secondary street address line.
 * Optional; if provided, max 255 characters.
 */
export function validateStreetLine2(value: string): FieldValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: true };
  }
  if (trimmed.length > ADDRESS_FIELD_LIMITS.streetLine2) {
    return { isValid: false, error: 'Apartment/suite must be 255 characters or less' };
  }
  return { isValid: true };
}

/**
 * Validates the city field.
 * Required, max 100 characters.
 */
export function validateCity(value: string): FieldValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: false, error: 'City is required' };
  }
  if (trimmed.length > ADDRESS_FIELD_LIMITS.city) {
    return { isValid: false, error: 'City must be 100 characters or less' };
  }
  return { isValid: true };
}

/**
 * Validates the state/province field.
 * Optional; if provided, max 100 characters.
 */
export function validateState(value: string): FieldValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: true };
  }
  if (trimmed.length > ADDRESS_FIELD_LIMITS.state) {
    return { isValid: false, error: 'State/province must be 100 characters or less' };
  }
  return { isValid: true };
}

/**
 * Validates the postal code field.
 * Required, max 20 characters.
 */
export function validatePostalCode(value: string): FieldValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Postal code is required' };
  }
  if (trimmed.length > ADDRESS_FIELD_LIMITS.postalCode) {
    return { isValid: false, error: 'Postal code must be 20 characters or less' };
  }
  return { isValid: true };
}

/**
 * Validates the country code field.
 * Required, exactly 2 characters (ISO 3166-1 alpha-2).
 * The UI auto-uppercases input, so case validation is not enforced here.
 */
export function validateCountryCode(value: string): FieldValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Country code is required' };
  }
  if (trimmed.length !== ADDRESS_FIELD_LIMITS.countryCode) {
    return {
      isValid: false,
      error: 'Country code must be exactly 2 characters (e.g. US, MX, ES)',
    };
  }
  return { isValid: true };
}

/**
 * Validates the phone field.
 * Optional; if provided, max 20 characters.
 */
export function validatePhone(value: string): FieldValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: true };
  }
  if (trimmed.length > ADDRESS_FIELD_LIMITS.phone) {
    return { isValid: false, error: 'Phone must be 20 characters or less' };
  }
  return { isValid: true };
}

/**
 * Validates the address label field.
 * Optional; if provided, max 50 characters.
 */
export function validateLabel(value: string): FieldValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: true };
  }
  if (trimmed.length > ADDRESS_FIELD_LIMITS.label) {
    return { isValid: false, error: 'Label must be 50 characters or less' };
  }
  return { isValid: true };
}

/**
 * Validates the full address form.
 * Calls all individual validators and returns combined result.
 */
export function validateAddressForm(fields: AddressFormFields): AddressFormValidationResult {
  const errors: AddressFormErrors = {};

  const labelResult = validateLabel(fields.label);
  if (!labelResult.isValid) errors.label = labelResult.error;

  const firstNameResult = validateFirstName(fields.firstName);
  if (!firstNameResult.isValid) errors.firstName = firstNameResult.error;

  const lastNameResult = validateLastName(fields.lastName);
  if (!lastNameResult.isValid) errors.lastName = lastNameResult.error;

  const streetLine1Result = validateStreetLine1(fields.streetLine1);
  if (!streetLine1Result.isValid) errors.streetLine1 = streetLine1Result.error;

  const streetLine2Result = validateStreetLine2(fields.streetLine2);
  if (!streetLine2Result.isValid) errors.streetLine2 = streetLine2Result.error;

  const cityResult = validateCity(fields.city);
  if (!cityResult.isValid) errors.city = cityResult.error;

  const stateResult = validateState(fields.state);
  if (!stateResult.isValid) errors.state = stateResult.error;

  const postalCodeResult = validatePostalCode(fields.postalCode);
  if (!postalCodeResult.isValid) errors.postalCode = postalCodeResult.error;

  const countryCodeResult = validateCountryCode(fields.countryCode);
  if (!countryCodeResult.isValid) errors.countryCode = countryCodeResult.error;

  const phoneResult = validatePhone(fields.phone);
  if (!phoneResult.isValid) errors.phone = phoneResult.error;

  const isValid = Object.keys(errors).length === 0;

  return { isValid, errors };
}
