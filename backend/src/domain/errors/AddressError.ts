/**
 * Base class for address-related errors.
 */
export class AddressError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'AddressError';
  }
}

/**
 * Thrown when an address is not found.
 */
export class AddressNotFoundError extends AddressError {
  constructor() {
    super('Address not found', 'ADDRESS_NOT_FOUND');
    this.name = 'AddressNotFoundError';
  }
}

/**
 * Thrown when a user has reached the maximum number of saved addresses.
 */
export class AddressLimitExceededError extends AddressError {
  constructor() {
    super('Address limit exceeded', 'ADDRESS_LIMIT_EXCEEDED');
    this.name = 'AddressLimitExceededError';
  }
}

/**
 * Thrown when address data is invalid.
 */
export class InvalidAddressDataError extends AddressError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'INVALID_ADDRESS_DATA');
    this.name = 'InvalidAddressDataError';
  }
}

/**
 * Thrown when attempting to delete an address that is marked as default.
 */
export class DefaultAddressCannotBeDeletedError extends AddressError {
  constructor() {
    super('Default address cannot be deleted', 'DEFAULT_ADDRESS_CANNOT_BE_DELETED');
    this.name = 'DefaultAddressCannotBeDeletedError';
  }
}
