import {
  ADDRESS_FIELD_LIMITS,
  validateFirstName,
  validateLastName,
  validateStreetLine1,
  validateStreetLine2,
  validateCity,
  validateState,
  validatePostalCode,
  validateCountryCode,
  validatePhone,
  validateLabel,
  validateAddressForm,
} from './address';

describe('ADDRESS_FIELD_LIMITS', () => {
  it('should match backend requirements', () => {
    expect(ADDRESS_FIELD_LIMITS).toEqual({
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
    });
  });
});

describe('validateFirstName', () => {
  it('should return valid for a valid name', () => {
    const result = validateFirstName('John');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid for empty string', () => {
    const result = validateFirstName('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('First name is required');
  });

  it('should return invalid for whitespace-only string', () => {
    const result = validateFirstName('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('First name is required');
  });

  it('should return invalid when exceeding 100 characters', () => {
    const result = validateFirstName('a'.repeat(101));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('First name must be 100 characters or less');
  });

  it('should return valid for exactly 100 characters', () => {
    const result = validateFirstName('a'.repeat(100));
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('validateLastName', () => {
  it('should return valid for a valid name', () => {
    const result = validateLastName('Doe');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid for empty string', () => {
    const result = validateLastName('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Last name is required');
  });

  it('should return invalid for whitespace-only string', () => {
    const result = validateLastName('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Last name is required');
  });

  it('should return invalid when exceeding 100 characters', () => {
    const result = validateLastName('a'.repeat(101));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Last name must be 100 characters or less');
  });

  it('should return valid for exactly 100 characters', () => {
    const result = validateLastName('a'.repeat(100));
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('validateStreetLine1', () => {
  it('should return valid for a valid street address', () => {
    const result = validateStreetLine1('123 Main St');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid for empty string', () => {
    const result = validateStreetLine1('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Street address is required');
  });

  it('should return invalid when exceeding 255 characters', () => {
    const result = validateStreetLine1('a'.repeat(256));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Street address must be 255 characters or less');
  });

  it('should return valid for exactly 255 characters', () => {
    const result = validateStreetLine1('a'.repeat(255));
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('validateStreetLine2', () => {
  it('should return valid for empty string (optional)', () => {
    const result = validateStreetLine2('');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return valid for a non-empty value', () => {
    const result = validateStreetLine2('Apt 4B');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid when exceeding 255 characters', () => {
    const result = validateStreetLine2('a'.repeat(256));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Apartment/suite must be 255 characters or less');
  });
});

describe('validateCity', () => {
  it('should return valid for a valid city', () => {
    const result = validateCity('New York');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid for empty string', () => {
    const result = validateCity('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('City is required');
  });

  it('should return invalid when exceeding 100 characters', () => {
    const result = validateCity('a'.repeat(101));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('City must be 100 characters or less');
  });
});

describe('validateState', () => {
  it('should return valid for empty string (optional)', () => {
    const result = validateState('');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return valid for a non-empty value', () => {
    const result = validateState('California');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid when exceeding 100 characters', () => {
    const result = validateState('a'.repeat(101));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('State/province must be 100 characters or less');
  });
});

describe('validatePostalCode', () => {
  it('should return valid for a valid postal code', () => {
    const result = validatePostalCode('10001');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid for empty string', () => {
    const result = validatePostalCode('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Postal code is required');
  });

  it('should return invalid when exceeding 20 characters', () => {
    const result = validatePostalCode('a'.repeat(21));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Postal code must be 20 characters or less');
  });
});

describe('validateCountryCode', () => {
  it('should return valid for a 2-character code', () => {
    const result = validateCountryCode('US');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid for empty string', () => {
    const result = validateCountryCode('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Country code is required');
  });

  it('should return invalid for a 1-character code', () => {
    const result = validateCountryCode('U');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Country code must be exactly 2 characters (e.g. US, MX, ES)');
  });

  it('should return invalid for a 3-character code', () => {
    const result = validateCountryCode('USA');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Country code must be exactly 2 characters (e.g. US, MX, ES)');
  });

  it('should return valid for a lowercase 2-character code (case is handled by UI)', () => {
    const result = validateCountryCode('us');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('validatePhone', () => {
  it('should return valid for empty string (optional)', () => {
    const result = validatePhone('');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return valid for a non-empty phone number', () => {
    const result = validatePhone('+1-555-555-5555');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid when exceeding 20 characters', () => {
    const result = validatePhone('1'.repeat(21));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Phone must be 20 characters or less');
  });
});

describe('validateLabel', () => {
  it('should return valid for empty string (optional)', () => {
    const result = validateLabel('');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return valid for a non-empty label', () => {
    const result = validateLabel('Home');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid when exceeding 50 characters', () => {
    const result = validateLabel('a'.repeat(51));
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Label must be 50 characters or less');
  });
});

describe('validateAddressForm', () => {
  const validForm = {
    label: '',
    firstName: 'John',
    lastName: 'Doe',
    streetLine1: '123 Main St',
    streetLine2: '',
    city: 'New York',
    state: '',
    postalCode: '10001',
    countryCode: 'US',
    phone: '',
    isDefault: false,
  };

  it('should return valid when all required fields are provided', () => {
    const result = validateAddressForm(validForm);
    expect(result.isValid).toBe(true);
    expect(Object.values(result.errors).every((e) => !e)).toBe(true);
  });

  it('should return invalid when a required field is empty', () => {
    const result = validateAddressForm({ ...validForm, firstName: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.firstName).toBe('First name is required');
  });

  it('should return multiple errors when multiple required fields are empty', () => {
    const result = validateAddressForm({
      ...validForm,
      firstName: '',
      city: '',
      postalCode: '',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.firstName).toBe('First name is required');
    expect(result.errors.city).toBe('City is required');
    expect(result.errors.postalCode).toBe('Postal code is required');
  });

  it('should return valid when optional fields are empty', () => {
    const result = validateAddressForm({
      ...validForm,
      label: '',
      streetLine2: '',
      state: '',
      phone: '',
    });
    expect(result.isValid).toBe(true);
  });
});
