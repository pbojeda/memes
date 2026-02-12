const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 100;

/**
 * Validates a slug string.
 * @param slug - Value to validate
 * @param fieldName - Field name for error messages
 * @param required - Whether the slug is required (true) or being updated (false)
 * @param throwError - Error constructor to use for validation failures
 * @returns Validated, trimmed slug string
 */
export function validateSlug(
  slug: unknown,
  fieldName: string,
  required: boolean,
  throwError: (message: string, field: string) => never,
): string {
  if (!slug || (typeof slug === 'string' && slug.trim() === '')) {
    if (required) {
      throwError('Slug is required', fieldName);
    }
    throwError('Slug cannot be empty', fieldName);
  }

  if (typeof slug !== 'string') {
    throwError('Slug must be a string', fieldName);
  }

  const trimmedSlug = slug.trim();

  if (trimmedSlug.length > MAX_SLUG_LENGTH) {
    throwError(`Slug exceeds ${MAX_SLUG_LENGTH} characters`, fieldName);
  }

  if (trimmedSlug !== trimmedSlug.toLowerCase()) {
    throwError('Slug must be lowercase', fieldName);
  }

  if (!SLUG_REGEX.test(trimmedSlug)) {
    throwError('Slug must contain only lowercase letters, numbers, and hyphens', fieldName);
  }

  return trimmedSlug;
}

/**
 * Validates a UUID string.
 * @param id - Value to validate
 * @param fieldName - Field name for error messages
 * @param throwError - Error constructor to use for validation failures
 * @returns Validated UUID string
 */
export function validateUUID(
  id: unknown,
  fieldName: string,
  throwError: (message: string, field: string) => never,
): string {
  if (!id || typeof id !== 'string') {
    throwError('ID is required', fieldName);
  }

  if (!UUID_REGEX.test(id)) {
    throwError('Invalid ID format', fieldName);
  }

  return id;
}
