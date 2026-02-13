import { InvalidProductReviewDataError } from '../../domain/errors/ProductReviewError';

const MAX_AUTHOR_NAME_LENGTH = 100;
const MIN_COMMENT_LENGTH = 10;
const MAX_COMMENT_LENGTH = 2000;
const MIN_RATING = 1;
const MAX_RATING = 5;

export interface CreateReviewInput {
  authorName: string;
  rating: number;
  comment: string;
  isAiGenerated?: boolean;
  isVisible?: boolean;
}

export interface ValidatedCreateReviewInput {
  authorName: string;
  rating: number;
  comment: string;
  isAiGenerated: boolean;
  isVisible: boolean;
}

export interface UpdateReviewInput {
  authorName?: string;
  rating?: number;
  comment?: string;
  isVisible?: boolean;
}

export interface ValidatedUpdateReviewInput {
  authorName?: string;
  rating?: number;
  comment?: string;
  isVisible?: boolean;
}

export interface ToggleVisibilityInput {
  isVisible: boolean;
}

export interface ValidatedToggleVisibilityInput {
  isVisible: boolean;
}

export interface ListReviewsInput {
  page?: number;
  limit?: number;
}

export interface ValidatedListReviewsInput {
  page: number;
  limit: number;
}

/**
 * Validates author name.
 * @param authorName - Author name to validate
 * @param fieldName - Field name for error messages
 * @param required - Whether the field is required
 * @returns Validated, trimmed author name string
 * @throws {InvalidProductReviewDataError} If author name is invalid
 */
function validateAuthorName(authorName: unknown, fieldName: string, required: boolean): string {
  if (!authorName || (typeof authorName === 'string' && authorName.trim() === '')) {
    if (required) {
      throw new InvalidProductReviewDataError('Author name is required', fieldName);
    }
    throw new InvalidProductReviewDataError('Author name cannot be empty', fieldName);
  }

  if (typeof authorName !== 'string') {
    throw new InvalidProductReviewDataError('Author name must be a string', fieldName);
  }

  const trimmedName = authorName.trim();

  if (trimmedName.length > MAX_AUTHOR_NAME_LENGTH) {
    throw new InvalidProductReviewDataError(
      `Author name exceeds ${MAX_AUTHOR_NAME_LENGTH} characters`,
      fieldName
    );
  }

  return trimmedName;
}

/**
 * Validates rating.
 * @param rating - Rating to validate
 * @param fieldName - Field name for error messages
 * @param required - Whether the field is required
 * @returns Validated rating
 * @throws {InvalidProductReviewDataError} If rating is invalid
 */
function validateRating(rating: unknown, fieldName: string, required: boolean): number {
  if (rating === undefined) {
    if (required) {
      throw new InvalidProductReviewDataError('Rating is required', fieldName);
    }
    throw new InvalidProductReviewDataError('Rating cannot be undefined', fieldName);
  }

  if (typeof rating !== 'number') {
    throw new InvalidProductReviewDataError('Rating must be a number', fieldName);
  }

  if (!Number.isInteger(rating)) {
    throw new InvalidProductReviewDataError('Rating must be an integer', fieldName);
  }

  if (rating < MIN_RATING || rating > MAX_RATING) {
    throw new InvalidProductReviewDataError(
      `Rating must be between ${MIN_RATING} and ${MAX_RATING}`,
      fieldName
    );
  }

  return rating;
}

/**
 * Validates comment.
 * @param comment - Comment to validate
 * @param fieldName - Field name for error messages
 * @param required - Whether the field is required
 * @param enforceMinLength - Whether to enforce minimum length
 * @returns Validated comment string
 * @throws {InvalidProductReviewDataError} If comment is invalid
 */
function validateComment(
  comment: unknown,
  fieldName: string,
  required: boolean,
  enforceMinLength: boolean
): string {
  if (!comment || (typeof comment === 'string' && comment.trim() === '')) {
    if (required) {
      throw new InvalidProductReviewDataError('Comment is required', fieldName);
    }
    throw new InvalidProductReviewDataError('Comment cannot be empty', fieldName);
  }

  if (typeof comment !== 'string') {
    throw new InvalidProductReviewDataError('Comment must be a string', fieldName);
  }

  const trimmedComment = comment.trim();

  if (enforceMinLength && trimmedComment.length < MIN_COMMENT_LENGTH) {
    throw new InvalidProductReviewDataError(
      `Comment must be at least ${MIN_COMMENT_LENGTH} characters`,
      fieldName
    );
  }

  if (trimmedComment.length > MAX_COMMENT_LENGTH) {
    throw new InvalidProductReviewDataError(
      `Comment exceeds ${MAX_COMMENT_LENGTH} characters`,
      fieldName
    );
  }

  return trimmedComment;
}

/**
 * Validates isAiGenerated flag.
 * @param isAiGenerated - Flag to validate
 * @param fieldName - Field name for error messages
 * @returns Validated boolean (defaults to false if undefined)
 * @throws {InvalidProductReviewDataError} If isAiGenerated is not a boolean
 */
function validateIsAiGenerated(isAiGenerated: unknown, fieldName: string): boolean {
  if (isAiGenerated === undefined) {
    return false;
  }

  if (typeof isAiGenerated !== 'boolean') {
    throw new InvalidProductReviewDataError('isAiGenerated must be a boolean', fieldName);
  }

  return isAiGenerated;
}

/**
 * Validates isVisible flag.
 * @param isVisible - Flag to validate
 * @param fieldName - Field name for error messages
 * @param required - Whether the field is required
 * @returns Validated boolean (defaults to true if undefined and not required)
 * @throws {InvalidProductReviewDataError} If isVisible is not a boolean
 */
function validateIsVisible(isVisible: unknown, fieldName: string, required: boolean): boolean {
  if (isVisible === undefined) {
    if (required) {
      throw new InvalidProductReviewDataError('isVisible is required', fieldName);
    }
    return true;
  }

  if (typeof isVisible !== 'boolean') {
    throw new InvalidProductReviewDataError('isVisible must be a boolean', fieldName);
  }

  return isVisible;
}

/**
 * Validates pagination page number.
 * @param page - Page number to validate
 * @param fieldName - Field name for error messages
 * @returns Validated page number (defaults to 1 if undefined)
 * @throws {InvalidProductReviewDataError} If page is invalid
 */
function validatePage(page: unknown, fieldName: string): number {
  if (page === undefined) {
    return 1;
  }

  if (typeof page !== 'number') {
    throw new InvalidProductReviewDataError('Page must be a number', fieldName);
  }

  if (page < 1) {
    throw new InvalidProductReviewDataError('Page must be greater than or equal to 1', fieldName);
  }

  return page;
}

/**
 * Validates pagination limit.
 * @param limit - Limit to validate
 * @param fieldName - Field name for error messages
 * @returns Validated limit (defaults to 20 if undefined)
 * @throws {InvalidProductReviewDataError} If limit is invalid
 */
function validateLimit(limit: unknown, fieldName: string): number {
  if (limit === undefined) {
    return 20;
  }

  if (typeof limit !== 'number') {
    throw new InvalidProductReviewDataError('Limit must be a number', fieldName);
  }

  if (limit < 1) {
    throw new InvalidProductReviewDataError('Limit must be greater than or equal to 1', fieldName);
  }

  if (limit > 100) {
    throw new InvalidProductReviewDataError('Limit must be less than or equal to 100', fieldName);
  }

  return limit;
}

/**
 * Validates input for creating a product review.
 * @param input - Input to validate
 * @returns Validated input with defaults
 * @throws {InvalidProductReviewDataError} If validation fails
 */
export function validateCreateReviewInput(
  input: CreateReviewInput
): ValidatedCreateReviewInput {
  const authorName = validateAuthorName(input.authorName, 'authorName', true);
  const rating = validateRating(input.rating, 'rating', true);
  const comment = validateComment(input.comment, 'comment', true, true);
  const isAiGenerated = validateIsAiGenerated(input.isAiGenerated, 'isAiGenerated');
  const isVisible = validateIsVisible(input.isVisible, 'isVisible', false);

  return {
    authorName,
    rating,
    comment,
    isAiGenerated,
    isVisible,
  };
}

/**
 * Validates input for updating a product review.
 * Note: isAiGenerated is immutable and cannot be updated.
 * @param input - Input to validate
 * @returns Validated input (only provided fields)
 * @throws {InvalidProductReviewDataError} If validation fails
 */
export function validateUpdateReviewInput(
  input: UpdateReviewInput
): ValidatedUpdateReviewInput {
  const validated: ValidatedUpdateReviewInput = {};

  if (input.authorName !== undefined) {
    validated.authorName = validateAuthorName(input.authorName, 'authorName', false);
  }

  if (input.rating !== undefined) {
    validated.rating = validateRating(input.rating, 'rating', false);
  }

  if (input.comment !== undefined) {
    // Do NOT enforce minLength on update (per API spec)
    validated.comment = validateComment(input.comment, 'comment', false, false);
  }

  if (input.isVisible !== undefined) {
    validated.isVisible = validateIsVisible(input.isVisible, 'isVisible', false);
  }

  // isAiGenerated is immutable - not included in update

  return validated;
}

/**
 * Validates input for toggling review visibility.
 * @param input - Input to validate
 * @returns Validated input
 * @throws {InvalidProductReviewDataError} If validation fails
 */
export function validateToggleVisibilityInput(
  input: ToggleVisibilityInput
): ValidatedToggleVisibilityInput {
  const isVisible = validateIsVisible(input.isVisible, 'isVisible', true);

  return {
    isVisible,
  };
}

/**
 * Validates input for listing reviews (pagination).
 * @param input - Input to validate
 * @returns Validated input with defaults
 * @throws {InvalidProductReviewDataError} If validation fails
 */
export function validateListReviewsInput(
  input: ListReviewsInput
): ValidatedListReviewsInput {
  const page = validatePage(input.page, 'page');
  const limit = validateLimit(input.limit, 'limit');

  return {
    page,
    limit,
  };
}
