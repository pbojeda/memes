import {
  validateCreateReviewInput,
  validateUpdateReviewInput,
  validateToggleVisibilityInput,
  validateListReviewsInput,
  type CreateReviewInput,
  type UpdateReviewInput,
  type ToggleVisibilityInput,
  type ListReviewsInput,
} from './productReviewValidator';
import { InvalidProductReviewDataError } from '../../domain/errors/ProductReviewError';

describe('productReviewValidator', () => {
  describe('validateCreateReviewInput', () => {
    it('should pass for valid input with all fields', () => {
      const input: CreateReviewInput = {
        authorName: 'John Doe',
        rating: 5,
        comment: 'This is an excellent product! Very satisfied.',
        isAiGenerated: false,
        isVisible: true,
      };

      const result = validateCreateReviewInput(input);

      expect(result).toEqual({
        authorName: 'John Doe',
        rating: 5,
        comment: 'This is an excellent product! Very satisfied.',
        isAiGenerated: false,
        isVisible: true,
      });
    });

    it('should use defaults for isAiGenerated (false) and isVisible (true)', () => {
      const input: CreateReviewInput = {
        authorName: 'Jane Smith',
        rating: 4,
        comment: 'Good product overall, would recommend.',
      };

      const result = validateCreateReviewInput(input);

      expect(result).toEqual({
        authorName: 'Jane Smith',
        rating: 4,
        comment: 'Good product overall, would recommend.',
        isAiGenerated: false,
        isVisible: true,
      });
    });

    it('should trim authorName', () => {
      const input: CreateReviewInput = {
        authorName: '  John Doe  ',
        rating: 5,
        comment: 'Great product!',
      };

      const result = validateCreateReviewInput(input);

      expect(result.authorName).toBe('John Doe');
    });

    it('should throw for missing authorName', () => {
      const input = {
        rating: 5,
        comment: 'Great product!',
      } as CreateReviewInput;

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('Author name is required');
    });

    it('should throw for empty authorName', () => {
      const input: CreateReviewInput = {
        authorName: '  ',
        rating: 5,
        comment: 'Great product!',
      };

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('Author name is required');
    });

    it('should throw for non-string authorName', () => {
      const input = {
        authorName: 123,
        rating: 5,
        comment: 'Great product!',
      } as any;

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('Author name must be a string');
    });

    it('should throw for authorName exceeding 100 characters', () => {
      const input: CreateReviewInput = {
        authorName: 'a'.repeat(101),
        rating: 5,
        comment: 'Great product!',
      };

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow(
        'Author name exceeds 100 characters'
      );
    });

    it('should throw for missing rating', () => {
      const input = {
        authorName: 'John Doe',
        comment: 'Great product!',
      } as CreateReviewInput;

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('Rating is required');
    });

    it('should throw for non-integer rating', () => {
      const input = {
        authorName: 'John Doe',
        rating: 4.5,
        comment: 'Great product!',
      } as any;

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('Rating must be an integer');
    });

    it('should throw for rating below 1', () => {
      const input = {
        authorName: 'John Doe',
        rating: 0,
        comment: 'Great product!',
      } as any;

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('Rating must be between 1 and 5');
    });

    it('should throw for rating above 5', () => {
      const input = {
        authorName: 'John Doe',
        rating: 6,
        comment: 'Great product!',
      } as any;

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('Rating must be between 1 and 5');
    });

    it('should throw for zero rating', () => {
      const input = {
        authorName: 'John Doe',
        rating: 0,
        comment: 'Great product!',
      } as any;

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('Rating must be between 1 and 5');
    });

    it('should throw for fractional rating', () => {
      const input = {
        authorName: 'John Doe',
        rating: 3.7,
        comment: 'Great product!',
      } as any;

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('Rating must be an integer');
    });

    it('should throw for missing comment', () => {
      const input = {
        authorName: 'John Doe',
        rating: 5,
      } as CreateReviewInput;

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('Comment is required');
    });

    it('should throw for empty comment', () => {
      const input: CreateReviewInput = {
        authorName: 'John Doe',
        rating: 5,
        comment: '   ',
      };

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('Comment is required');
    });

    it('should throw for non-string comment', () => {
      const input = {
        authorName: 'John Doe',
        rating: 5,
        comment: 123,
      } as any;

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('Comment must be a string');
    });

    it('should throw for comment less than 10 characters', () => {
      const input: CreateReviewInput = {
        authorName: 'John Doe',
        rating: 5,
        comment: 'Too short',
      };

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow(
        'Comment must be at least 10 characters'
      );
    });

    it('should throw for comment exceeding 2000 characters', () => {
      const input: CreateReviewInput = {
        authorName: 'John Doe',
        rating: 5,
        comment: 'a'.repeat(2001),
      };

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('Comment exceeds 2000 characters');
    });

    it('should throw for non-boolean isAiGenerated', () => {
      const input = {
        authorName: 'John Doe',
        rating: 5,
        comment: 'Great product!',
        isAiGenerated: 'yes',
      } as any;

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('isAiGenerated must be a boolean');
    });

    it('should throw for non-boolean isVisible', () => {
      const input = {
        authorName: 'John Doe',
        rating: 5,
        comment: 'Great product!',
        isVisible: 1,
      } as any;

      expect(() => validateCreateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateCreateReviewInput(input)).toThrow('isVisible must be a boolean');
    });
  });

  describe('validateUpdateReviewInput', () => {
    it('should pass for updating all fields', () => {
      const input: UpdateReviewInput = {
        authorName: 'Updated Name',
        rating: 3,
        comment: 'Updated comment text here',
        isVisible: false,
      };

      const result = validateUpdateReviewInput(input);

      expect(result).toEqual(input);
    });

    it('should pass for updating only authorName', () => {
      const input: UpdateReviewInput = {
        authorName: 'Updated Name',
      };

      const result = validateUpdateReviewInput(input);

      expect(result).toEqual({ authorName: 'Updated Name' });
    });

    it('should pass for updating only rating', () => {
      const input: UpdateReviewInput = {
        rating: 4,
      };

      const result = validateUpdateReviewInput(input);

      expect(result).toEqual({ rating: 4 });
    });

    it('should pass for updating only comment', () => {
      const input: UpdateReviewInput = {
        comment: 'New comment text',
      };

      const result = validateUpdateReviewInput(input);

      expect(result).toEqual({ comment: 'New comment text' });
    });

    it('should pass for updating only isVisible', () => {
      const input: UpdateReviewInput = {
        isVisible: false,
      };

      const result = validateUpdateReviewInput(input);

      expect(result).toEqual({ isVisible: false });
    });

    it('should pass for empty update (no fields)', () => {
      const input: UpdateReviewInput = {};

      const result = validateUpdateReviewInput(input);

      expect(result).toEqual({});
    });

    it('should throw for invalid authorName type', () => {
      const input = {
        authorName: 123,
      } as any;

      expect(() => validateUpdateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateUpdateReviewInput(input)).toThrow('Author name must be a string');
    });

    it('should throw for authorName exceeding 100 characters', () => {
      const input: UpdateReviewInput = {
        authorName: 'a'.repeat(101),
      };

      expect(() => validateUpdateReviewInput(input)).toThrow(InvalidProductReviewDataError);
    });

    it('should throw for invalid rating type', () => {
      const input = {
        rating: 'five',
      } as any;

      expect(() => validateUpdateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateUpdateReviewInput(input)).toThrow('Rating must be a number');
    });

    it('should throw for invalid comment type', () => {
      const input = {
        comment: 123,
      } as any;

      expect(() => validateUpdateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateUpdateReviewInput(input)).toThrow('Comment must be a string');
    });

    it('should NOT enforce comment minLength on update', () => {
      const input: UpdateReviewInput = {
        comment: 'Short',
      };

      // Should not throw
      const result = validateUpdateReviewInput(input);
      expect(result.comment).toBe('Short');
    });

    it('should throw for comment exceeding 2000 characters on update', () => {
      const input: UpdateReviewInput = {
        comment: 'a'.repeat(2001),
      };

      expect(() => validateUpdateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateUpdateReviewInput(input)).toThrow('Comment exceeds 2000 characters');
    });

    it('should NOT accept isAiGenerated (immutable field)', () => {
      const input = {
        isAiGenerated: true,
      } as any;

      // Should be filtered out - not in ValidatedUpdateReviewInput
      const result = validateUpdateReviewInput(input);
      expect(result).toEqual({});
    });

    it('should throw for invalid isVisible type', () => {
      const input = {
        isVisible: 'yes',
      } as any;

      expect(() => validateUpdateReviewInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateUpdateReviewInput(input)).toThrow('isVisible must be a boolean');
    });
  });

  describe('validateToggleVisibilityInput', () => {
    it('should pass for isVisible=true', () => {
      const input: ToggleVisibilityInput = {
        isVisible: true,
      };

      const result = validateToggleVisibilityInput(input);

      expect(result).toEqual({ isVisible: true });
    });

    it('should pass for isVisible=false', () => {
      const input: ToggleVisibilityInput = {
        isVisible: false,
      };

      const result = validateToggleVisibilityInput(input);

      expect(result).toEqual({ isVisible: false });
    });

    it('should throw for missing isVisible', () => {
      const input = {} as ToggleVisibilityInput;

      expect(() => validateToggleVisibilityInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateToggleVisibilityInput(input)).toThrow('isVisible is required');
    });

    it('should throw for non-boolean isVisible', () => {
      const input = {
        isVisible: 1,
      } as any;

      expect(() => validateToggleVisibilityInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateToggleVisibilityInput(input)).toThrow('isVisible must be a boolean');
    });
  });

  describe('validateListReviewsInput', () => {
    it('should use defaults (page:1, limit:20) for empty input', () => {
      const input: ListReviewsInput = {};

      const result = validateListReviewsInput(input);

      expect(result).toEqual({
        page: 1,
        limit: 20,
      });
    });

    it('should pass for valid page and limit', () => {
      const input: ListReviewsInput = {
        page: 3,
        limit: 50,
      };

      const result = validateListReviewsInput(input);

      expect(result).toEqual({
        page: 3,
        limit: 50,
      });
    });

    it('should throw for page less than 1', () => {
      const input: ListReviewsInput = {
        page: 0,
      };

      expect(() => validateListReviewsInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateListReviewsInput(input)).toThrow(
        'Page must be greater than or equal to 1'
      );
    });

    it('should throw for limit less than 1', () => {
      const input: ListReviewsInput = {
        limit: 0,
      };

      expect(() => validateListReviewsInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateListReviewsInput(input)).toThrow(
        'Limit must be greater than or equal to 1'
      );
    });

    it('should throw for limit greater than 100', () => {
      const input: ListReviewsInput = {
        limit: 101,
      };

      expect(() => validateListReviewsInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateListReviewsInput(input)).toThrow('Limit must be less than or equal to 100');
    });

    it('should throw for non-number page', () => {
      const input = {
        page: 'two',
      } as any;

      expect(() => validateListReviewsInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateListReviewsInput(input)).toThrow('Page must be a number');
    });

    it('should throw for non-number limit', () => {
      const input = {
        limit: 'fifty',
      } as any;

      expect(() => validateListReviewsInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateListReviewsInput(input)).toThrow('Limit must be a number');
    });

    it('should throw for NaN page', () => {
      const input: ListReviewsInput = {
        page: NaN,
      };

      expect(() => validateListReviewsInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateListReviewsInput(input)).toThrow('Page must be a number');
    });

    it('should throw for NaN limit', () => {
      const input: ListReviewsInput = {
        limit: NaN,
      };

      expect(() => validateListReviewsInput(input)).toThrow(InvalidProductReviewDataError);
      expect(() => validateListReviewsInput(input)).toThrow('Limit must be a number');
    });
  });
});
