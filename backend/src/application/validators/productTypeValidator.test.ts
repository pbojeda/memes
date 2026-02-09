import {
  validateCreateProductTypeInput,
  validateUpdateProductTypeInput,
  validateGetAllProductTypesInput,
  validateProductTypeId,
  type CreateProductTypeInput,
  type UpdateProductTypeInput,
  type GetAllProductTypesInput,
} from './productTypeValidator';
import { InvalidProductTypeDataError } from '../../domain/errors/ProductTypeError';
import { UserRole } from '../../generated/prisma/enums';

describe('productTypeValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCreateProductTypeInput', () => {
    describe('valid inputs', () => {
      it('should return validated data with all required fields', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta', en: 'T-Shirt' },
          slug: 't-shirt',
        };

        const result = validateCreateProductTypeInput(input);

        expect(result).toEqual({
          name: { es: 'Camiseta', en: 'T-Shirt' },
          slug: 't-shirt',
          hasSizes: false,
          isActive: true,
          sortOrder: 0,
        });
      });

      it('should return validated data with all optional fields', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Taza' },
          slug: 'mug',
          hasSizes: false,
          isActive: true,
          sortOrder: 10,
        };

        const result = validateCreateProductTypeInput(input);

        expect(result).toEqual({
          name: { es: 'Taza' },
          slug: 'mug',
          hasSizes: false,
          isActive: true,
          sortOrder: 10,
        });
      });

      it('should trim whitespace from slug', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: '  t-shirt  ',
        };

        const result = validateCreateProductTypeInput(input);

        expect(result.slug).toBe('t-shirt');
      });

      it('should accept name with only es key', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Producto' },
          slug: 'producto',
        };

        const result = validateCreateProductTypeInput(input);

        expect(result.name).toEqual({ es: 'Producto' });
      });

      it('should accept name with multiple language keys', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta', en: 'T-Shirt', fr: 'T-Shirt' },
          slug: 't-shirt',
        };

        const result = validateCreateProductTypeInput(input);

        expect(result.name).toEqual({ es: 'Camiseta', en: 'T-Shirt', fr: 'T-Shirt' });
      });
    });

    describe('name validation', () => {
      it('should throw InvalidProductTypeDataError when name is missing', () => {
        const input = {
          slug: 't-shirt',
        };

        expect(() => validateCreateProductTypeInput(input as never)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input as never)).toThrow('Name must be an object');
      });

      it('should throw InvalidProductTypeDataError when name is null', () => {
        const input = {
          name: null,
          slug: 't-shirt',
        };

        expect(() => validateCreateProductTypeInput(input as never)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input as never)).toThrow('Name must be an object');
      });

      it('should throw InvalidProductTypeDataError when name is not an object', () => {
        const input = {
          name: 'string',
          slug: 't-shirt',
        };

        expect(() => validateCreateProductTypeInput(input as never)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input as never)).toThrow('Name must be an object');
      });

      it('should throw InvalidProductTypeDataError when name is an array', () => {
        const input = {
          name: ['Camiseta'],
          slug: 't-shirt',
        };

        expect(() => validateCreateProductTypeInput(input as never)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input as never)).toThrow('Name must be an object');
      });

      it('should throw InvalidProductTypeDataError when name is missing es key', () => {
        const input: CreateProductTypeInput = {
          name: { en: 'T-Shirt' } as never,
          slug: 't-shirt',
        };

        expect(() => validateCreateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input)).toThrow('Name must include Spanish translation');
      });

      it('should throw InvalidProductTypeDataError when name value is not a string', () => {
        const input = {
          name: { es: 123 },
          slug: 't-shirt',
        };

        expect(() => validateCreateProductTypeInput(input as never)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input as never)).toThrow('Name.es must be a string');
      });

      it('should throw InvalidProductTypeDataError when name value is empty string', () => {
        const input: CreateProductTypeInput = {
          name: { es: '   ' },
          slug: 't-shirt',
        };

        expect(() => validateCreateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input)).toThrow('Name.es cannot be empty');
      });

      it('should throw InvalidProductTypeDataError when name value exceeds 100 characters', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'a'.repeat(101) },
          slug: 't-shirt',
        };

        expect(() => validateCreateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input)).toThrow('Name.es exceeds 100 characters');
      });

      it('should accept name value with exactly 100 characters', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'a'.repeat(100) },
          slug: 't-shirt',
        };

        const result = validateCreateProductTypeInput(input);

        expect(result.name.es).toHaveLength(100);
      });
    });

    describe('slug validation', () => {
      it('should throw InvalidProductTypeDataError when slug is missing', () => {
        const input = {
          name: { es: 'Camiseta' },
        };

        expect(() => validateCreateProductTypeInput(input as never)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input as never)).toThrow('Slug is required');
      });

      it('should throw InvalidProductTypeDataError when slug is empty', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: '',
        };

        expect(() => validateCreateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input)).toThrow('Slug is required');
      });

      it('should throw InvalidProductTypeDataError when slug is only whitespace', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: '   ',
        };

        expect(() => validateCreateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input)).toThrow('Slug is required');
      });

      it('should throw InvalidProductTypeDataError when slug contains uppercase', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: 'T-Shirt',
        };

        expect(() => validateCreateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input)).toThrow('Slug must be lowercase');
      });

      it('should throw InvalidProductTypeDataError when slug contains spaces', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: 't shirt',
        };

        expect(() => validateCreateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input)).toThrow('Slug must contain only lowercase letters, numbers, and hyphens');
      });

      it('should throw InvalidProductTypeDataError when slug contains special characters', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: 't_shirt!',
        };

        expect(() => validateCreateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input)).toThrow('Slug must contain only lowercase letters, numbers, and hyphens');
      });

      it('should throw InvalidProductTypeDataError when slug exceeds 100 characters', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: 'a'.repeat(101),
        };

        expect(() => validateCreateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input)).toThrow('Slug exceeds 100 characters');
      });

      it('should accept slug with exactly 100 characters', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: 'a'.repeat(100),
        };

        const result = validateCreateProductTypeInput(input);

        expect(result.slug).toHaveLength(100);
      });

      it('should accept slug with hyphens', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: 't-shirt-xl',
        };

        const result = validateCreateProductTypeInput(input);

        expect(result.slug).toBe('t-shirt-xl');
      });

      it('should accept slug with numbers', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: 't-shirt-2024',
        };

        const result = validateCreateProductTypeInput(input);

        expect(result.slug).toBe('t-shirt-2024');
      });
    });

    describe('hasSizes validation', () => {
      it('should throw InvalidProductTypeDataError when hasSizes is not a boolean', () => {
        const input = {
          name: { es: 'Camiseta' },
          slug: 't-shirt',
          hasSizes: 'true',
        };

        expect(() => validateCreateProductTypeInput(input as never)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input as never)).toThrow('hasSizes must be a boolean');
      });

      it('should accept hasSizes as true', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: 't-shirt',
          hasSizes: true,
        };

        const result = validateCreateProductTypeInput(input);

        expect(result.hasSizes).toBe(true);
      });

      it('should accept hasSizes as false', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Taza' },
          slug: 'mug',
          hasSizes: false,
        };

        const result = validateCreateProductTypeInput(input);

        expect(result.hasSizes).toBe(false);
      });
    });

    describe('isActive validation', () => {
      it('should throw InvalidProductTypeDataError when isActive is not a boolean', () => {
        const input = {
          name: { es: 'Camiseta' },
          slug: 't-shirt',
          isActive: 1,
        };

        expect(() => validateCreateProductTypeInput(input as never)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input as never)).toThrow('isActive must be a boolean');
      });

      it('should accept isActive as true', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: 't-shirt',
          isActive: true,
        };

        const result = validateCreateProductTypeInput(input);

        expect(result.isActive).toBe(true);
      });

      it('should accept isActive as false', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: 't-shirt',
          isActive: false,
        };

        const result = validateCreateProductTypeInput(input);

        expect(result.isActive).toBe(false);
      });
    });

    describe('sortOrder validation', () => {
      it('should throw InvalidProductTypeDataError when sortOrder is not a number', () => {
        const input = {
          name: { es: 'Camiseta' },
          slug: 't-shirt',
          sortOrder: '10',
        };

        expect(() => validateCreateProductTypeInput(input as never)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input as never)).toThrow('Sort order must be a number');
      });

      it('should throw InvalidProductTypeDataError when sortOrder is not an integer', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: 't-shirt',
          sortOrder: 10.5,
        };

        expect(() => validateCreateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input)).toThrow('Sort order must be an integer');
      });

      it('should throw InvalidProductTypeDataError when sortOrder is negative', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: 't-shirt',
          sortOrder: -1,
        };

        expect(() => validateCreateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateCreateProductTypeInput(input)).toThrow('Sort order cannot be negative');
      });

      it('should accept sortOrder as 0', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: 't-shirt',
          sortOrder: 0,
        };

        const result = validateCreateProductTypeInput(input);

        expect(result.sortOrder).toBe(0);
      });

      it('should accept sortOrder as positive integer', () => {
        const input: CreateProductTypeInput = {
          name: { es: 'Camiseta' },
          slug: 't-shirt',
          sortOrder: 100,
        };

        const result = validateCreateProductTypeInput(input);

        expect(result.sortOrder).toBe(100);
      });
    });
  });

  describe('validateUpdateProductTypeInput', () => {
    describe('valid inputs', () => {
      it('should return empty object when no fields provided', () => {
        const input: UpdateProductTypeInput = {};

        const result = validateUpdateProductTypeInput(input);

        expect(result).toEqual({});
      });

      it('should return validated data with partial update', () => {
        const input: UpdateProductTypeInput = {
          name: { es: 'Nueva Camiseta' },
          isActive: false,
        };

        const result = validateUpdateProductTypeInput(input);

        expect(result).toEqual({
          name: { es: 'Nueva Camiseta' },
          isActive: false,
        });
      });

      it('should return validated data with all fields', () => {
        const input: UpdateProductTypeInput = {
          name: { es: 'Camiseta', en: 'T-Shirt' },
          slug: 'new-slug',
          hasSizes: true,
          isActive: false,
          sortOrder: 20,
        };

        const result = validateUpdateProductTypeInput(input);

        expect(result).toEqual({
          name: { es: 'Camiseta', en: 'T-Shirt' },
          slug: 'new-slug',
          hasSizes: true,
          isActive: false,
          sortOrder: 20,
        });
      });
    });

    describe('validation errors', () => {
      it('should throw InvalidProductTypeDataError when name is invalid', () => {
        const input: UpdateProductTypeInput = {
          name: { en: 'T-Shirt' } as never,
        };

        expect(() => validateUpdateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateUpdateProductTypeInput(input)).toThrow('Name must include Spanish translation');
      });

      it('should throw InvalidProductTypeDataError when slug is empty', () => {
        const input: UpdateProductTypeInput = {
          slug: '',
        };

        expect(() => validateUpdateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateUpdateProductTypeInput(input)).toThrow('Slug cannot be empty');
      });

      it('should throw InvalidProductTypeDataError when slug is invalid format', () => {
        const input: UpdateProductTypeInput = {
          slug: 'UPPERCASE',
        };

        expect(() => validateUpdateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateUpdateProductTypeInput(input)).toThrow('Slug must be lowercase');
      });

      it('should throw InvalidProductTypeDataError when hasSizes is not boolean', () => {
        const input = {
          hasSizes: 'true',
        };

        expect(() => validateUpdateProductTypeInput(input as never)).toThrow(InvalidProductTypeDataError);
        expect(() => validateUpdateProductTypeInput(input as never)).toThrow('hasSizes must be a boolean');
      });

      it('should throw InvalidProductTypeDataError when sortOrder is negative', () => {
        const input: UpdateProductTypeInput = {
          sortOrder: -5,
        };

        expect(() => validateUpdateProductTypeInput(input)).toThrow(InvalidProductTypeDataError);
        expect(() => validateUpdateProductTypeInput(input)).toThrow('Sort order cannot be negative');
      });
    });
  });

  describe('validateGetAllProductTypesInput', () => {
    it('should return validated data with callerRole only', () => {
      const input: GetAllProductTypesInput = {
        callerRole: UserRole.TARGET,
      };

      const result = validateGetAllProductTypesInput(input);

      expect(result).toEqual({
        callerRole: UserRole.TARGET,
      });
    });

    it('should return validated data with isActive filter', () => {
      const input: GetAllProductTypesInput = {
        callerRole: UserRole.ADMIN,
        isActive: false,
      };

      const result = validateGetAllProductTypesInput(input);

      expect(result).toEqual({
        callerRole: UserRole.ADMIN,
        isActive: false,
      });
    });

    it('should accept PUBLIC callerRole', () => {
      const input: GetAllProductTypesInput = {
        callerRole: 'PUBLIC',
      };

      const result = validateGetAllProductTypesInput(input);

      expect(result.callerRole).toBe('PUBLIC');
    });

    it('should throw InvalidProductTypeDataError when isActive is not boolean', () => {
      const input = {
        callerRole: UserRole.ADMIN,
        isActive: 'true',
      };

      expect(() => validateGetAllProductTypesInput(input as never)).toThrow(InvalidProductTypeDataError);
      expect(() => validateGetAllProductTypesInput(input as never)).toThrow('isActive must be a boolean');
    });
  });

  describe('validateProductTypeId', () => {
    it('should return valid UUID', () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';

      const result = validateProductTypeId(id);

      expect(result).toBe(id);
    });

    it('should accept UUID in uppercase', () => {
      const id = '123E4567-E89B-12D3-A456-426614174000';

      const result = validateProductTypeId(id);

      expect(result).toBe(id);
    });

    it('should throw InvalidProductTypeDataError when ID is not UUID', () => {
      expect(() => validateProductTypeId('not-a-uuid')).toThrow(InvalidProductTypeDataError);
      expect(() => validateProductTypeId('not-a-uuid')).toThrow('Invalid ID format');
    });

    it('should throw InvalidProductTypeDataError when ID is empty', () => {
      expect(() => validateProductTypeId('')).toThrow(InvalidProductTypeDataError);
      expect(() => validateProductTypeId('')).toThrow('ID is required');
    });
  });
});
