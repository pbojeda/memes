import {
  validateListProductsInput,
  type ListProductsInput,
} from '../productValidator';
import { InvalidProductDataError } from '../../../domain/errors/ProductError';

describe('productValidator - validateListProductsInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('valid inputs', () => {
    it('should apply default values when no parameters provided', () => {
      const input: ListProductsInput = {};

      const result = validateListProductsInput(input);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortDirection).toBe('desc');
      expect(result.includeSoftDeleted).toBe(false);
    });

    it('should accept all valid parameters', () => {
      const input: ListProductsInput = {
        page: 2,
        limit: 50,
        productTypeId: '123e4567-e89b-12d3-a456-426614174000',
        isActive: true,
        isHot: false,
        minPrice: 10.00,
        maxPrice: 100.00,
        search: 'camiseta',
        sortBy: 'price',
        sortDirection: 'asc',
        includeSoftDeleted: true,
      };

      const result = validateListProductsInput(input);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
      expect(result.productTypeId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.isActive).toBe(true);
      expect(result.isHot).toBe(false);
      expect(result.minPrice).toBe(10.00);
      expect(result.maxPrice).toBe(100.00);
      expect(result.search).toBe('camiseta');
      expect(result.sortBy).toBe('price');
      expect(result.sortDirection).toBe('asc');
      expect(result.includeSoftDeleted).toBe(true);
    });

    it('should accept partial parameters with defaults for omitted ones', () => {
      const input: ListProductsInput = {
        page: 3,
        isActive: true,
      };

      const result = validateListProductsInput(input);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
      expect(result.isActive).toBe(true);
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortDirection).toBe('desc');
    });

    it('should accept limit at minimum boundary (1)', () => {
      const input: ListProductsInput = {
        limit: 1,
      };

      const result = validateListProductsInput(input);

      expect(result.limit).toBe(1);
    });

    it('should accept limit at maximum boundary (100)', () => {
      const input: ListProductsInput = {
        limit: 100,
      };

      const result = validateListProductsInput(input);

      expect(result.limit).toBe(100);
    });

    it('should accept minPrice equal to maxPrice', () => {
      const input: ListProductsInput = {
        minPrice: 25.00,
        maxPrice: 25.00,
      };

      const result = validateListProductsInput(input);

      expect(result.minPrice).toBe(25.00);
      expect(result.maxPrice).toBe(25.00);
    });

    it('should accept all allowed sortBy values', () => {
      const allowedSortBy = ['price', 'createdAt', 'salesCount'];

      allowedSortBy.forEach((sortBy) => {
        const input: ListProductsInput = { sortBy };

        const result = validateListProductsInput(input);

        expect(result.sortBy).toBe(sortBy);
      });
    });

    it('should accept both sortDirection values', () => {
      const directions = ['asc', 'desc'];

      directions.forEach((direction) => {
        const input: ListProductsInput = { sortDirection: direction as 'asc' | 'desc' };

        const result = validateListProductsInput(input);

        expect(result.sortDirection).toBe(direction);
      });
    });
  });

  describe('pagination validation', () => {
    it('should throw InvalidProductDataError when page is less than 1', () => {
      const input: ListProductsInput = {
        page: 0,
      };

      expect(() => validateListProductsInput(input)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input)).toThrow('Page must be at least 1');
    });

    it('should throw InvalidProductDataError when page is negative', () => {
      const input: ListProductsInput = {
        page: -5,
      };

      expect(() => validateListProductsInput(input)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input)).toThrow('Page must be at least 1');
    });

    it('should throw InvalidProductDataError when page is not a number', () => {
      const input = {
        page: '2',
      };

      expect(() => validateListProductsInput(input as never)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input as never)).toThrow('Page must be a number');
    });

    it('should throw InvalidProductDataError when limit is less than 1', () => {
      const input: ListProductsInput = {
        limit: 0,
      };

      expect(() => validateListProductsInput(input)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input)).toThrow('Limit must be between 1 and 100');
    });

    it('should throw InvalidProductDataError when limit is greater than 100', () => {
      const input: ListProductsInput = {
        limit: 101,
      };

      expect(() => validateListProductsInput(input)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input)).toThrow('Limit must be between 1 and 100');
    });

    it('should throw InvalidProductDataError when limit is not a number', () => {
      const input = {
        limit: '50',
      };

      expect(() => validateListProductsInput(input as never)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input as never)).toThrow('Limit must be a number');
    });
  });

  describe('filter validation', () => {
    it('should throw InvalidProductDataError when productTypeId is not a valid UUID', () => {
      const input: ListProductsInput = {
        productTypeId: 'not-a-uuid',
      };

      expect(() => validateListProductsInput(input)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input)).toThrow('Invalid ID format');
    });

    it('should throw InvalidProductDataError when isActive is not a boolean', () => {
      const input = {
        isActive: 'true',
      };

      expect(() => validateListProductsInput(input as never)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input as never)).toThrow('isActive must be a boolean');
    });

    it('should throw InvalidProductDataError when isHot is not a boolean', () => {
      const input = {
        isHot: 1,
      };

      expect(() => validateListProductsInput(input as never)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input as never)).toThrow('isHot must be a boolean');
    });

    it('should throw InvalidProductDataError when minPrice is not a number', () => {
      const input = {
        minPrice: '10.00',
      };

      expect(() => validateListProductsInput(input as never)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input as never)).toThrow('minPrice must be a number');
    });

    it('should throw InvalidProductDataError when minPrice is negative', () => {
      const input: ListProductsInput = {
        minPrice: -5.00,
      };

      expect(() => validateListProductsInput(input)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input)).toThrow('minPrice must be greater than or equal to 0');
    });

    it('should throw InvalidProductDataError when maxPrice is not a number', () => {
      const input = {
        maxPrice: '100.00',
      };

      expect(() => validateListProductsInput(input as never)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input as never)).toThrow('maxPrice must be a number');
    });

    it('should throw InvalidProductDataError when maxPrice is negative', () => {
      const input: ListProductsInput = {
        maxPrice: -10.00,
      };

      expect(() => validateListProductsInput(input)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input)).toThrow('maxPrice must be greater than or equal to 0');
    });

    it('should throw InvalidProductDataError when minPrice is greater than maxPrice', () => {
      const input: ListProductsInput = {
        minPrice: 100.00,
        maxPrice: 50.00,
      };

      expect(() => validateListProductsInput(input)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input)).toThrow('minPrice cannot be greater than maxPrice');
    });

    it('should throw InvalidProductDataError when search is not a string', () => {
      const input = {
        search: 123,
      };

      expect(() => validateListProductsInput(input as never)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input as never)).toThrow('search must be a string');
    });

    it('should return undefined search when search is empty string', () => {
      const input: ListProductsInput = {
        search: '',
      };

      const result = validateListProductsInput(input);

      expect(result.search).toBeUndefined();
    });

    it('should return undefined search when search is only whitespace', () => {
      const input: ListProductsInput = {
        search: '   ',
      };

      const result = validateListProductsInput(input);

      expect(result.search).toBeUndefined();
    });

    it('should accept search with leading/trailing whitespace trimmed', () => {
      const input: ListProductsInput = {
        search: '  camiseta  ',
      };

      const result = validateListProductsInput(input);

      expect(result.search).toBe('camiseta');
    });

    it('should throw InvalidProductDataError when search exceeds 100 characters', () => {
      const input: ListProductsInput = {
        search: 'a'.repeat(101),
      };

      expect(() => validateListProductsInput(input)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input)).toThrow('search exceeds 100 characters');
    });

    it('should accept search at exactly 100 characters', () => {
      const input: ListProductsInput = {
        search: 'a'.repeat(100),
      };

      const result = validateListProductsInput(input);

      expect(result.search).toBe('a'.repeat(100));
    });

    it('should handle search strings with special characters', () => {
      const input: ListProductsInput = {
        search: "O'Reilly & Sons <script>",
      };

      const result = validateListProductsInput(input);

      expect(result.search).toBe("O'Reilly & Sons <script>");
    });

    it('should return undefined search when combined with other valid filters', () => {
      const input: ListProductsInput = {
        search: '  ',
        isActive: true,
        minPrice: 10,
      };

      const result = validateListProductsInput(input);

      expect(result.search).toBeUndefined();
      expect(result.isActive).toBe(true);
      expect(result.minPrice).toBe(10);
    });
  });

  describe('sort validation', () => {
    it('should throw InvalidProductDataError when sortBy is not in whitelist', () => {
      const input = {
        sortBy: 'title',
      };

      expect(() => validateListProductsInput(input as never)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input as never)).toThrow('sortBy must be one of: price, createdAt, salesCount');
    });

    it('should throw InvalidProductDataError when sortBy is not a string', () => {
      const input = {
        sortBy: 123,
      };

      expect(() => validateListProductsInput(input as never)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input as never)).toThrow('sortBy must be a string');
    });

    it('should throw InvalidProductDataError when sortDirection is not asc or desc', () => {
      const input = {
        sortDirection: 'ascending',
      };

      expect(() => validateListProductsInput(input as never)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input as never)).toThrow('sortDirection must be either asc or desc');
    });

    it('should throw InvalidProductDataError when sortDirection is not a string', () => {
      const input = {
        sortDirection: 1,
      };

      expect(() => validateListProductsInput(input as never)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input as never)).toThrow('sortDirection must be a string');
    });
  });

  describe('includeSoftDeleted validation', () => {
    it('should throw InvalidProductDataError when includeSoftDeleted is not a boolean', () => {
      const input = {
        includeSoftDeleted: 'true',
      };

      expect(() => validateListProductsInput(input as never)).toThrow(InvalidProductDataError);
      expect(() => validateListProductsInput(input as never)).toThrow('includeSoftDeleted must be a boolean');
    });

    it('should accept includeSoftDeleted as true', () => {
      const input: ListProductsInput = {
        includeSoftDeleted: true,
      };

      const result = validateListProductsInput(input);

      expect(result.includeSoftDeleted).toBe(true);
    });

    it('should accept includeSoftDeleted as false', () => {
      const input: ListProductsInput = {
        includeSoftDeleted: false,
      };

      const result = validateListProductsInput(input);

      expect(result.includeSoftDeleted).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should accept minPrice as 0', () => {
      const input: ListProductsInput = {
        minPrice: 0,
      };

      const result = validateListProductsInput(input);

      expect(result.minPrice).toBe(0);
    });

    it('should accept maxPrice as 0', () => {
      const input: ListProductsInput = {
        maxPrice: 0,
      };

      const result = validateListProductsInput(input);

      expect(result.maxPrice).toBe(0);
    });

    it('should handle decimal prices correctly', () => {
      const input: ListProductsInput = {
        minPrice: 10.99,
        maxPrice: 99.99,
      };

      const result = validateListProductsInput(input);

      expect(result.minPrice).toBe(10.99);
      expect(result.maxPrice).toBe(99.99);
    });
  });
});
