import {
  validateCreateProductInput,
  validateUpdateProductInput,
  validateProductId,
  type CreateProductInput,
  type UpdateProductInput,
} from './productValidator';
import { InvalidProductDataError } from '../../domain/errors/ProductError';

describe('productValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCreateProductInput', () => {
    describe('valid inputs', () => {
      it('should return validated data with all required fields', () => {
        const input: CreateProductInput = {
          title: { es: 'Camiseta Premium' },
          description: { es: 'Una camiseta de alta calidad' },
          slug: 'camiseta-premium',
          price: 29.99,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        const result = validateCreateProductInput(input);

        expect(result).toEqual({
          title: { es: 'Camiseta Premium' },
          description: { es: 'Una camiseta de alta calidad' },
          slug: 'camiseta-premium',
          price: 29.99,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
          isActive: true,
          isHot: false,
          salesCount: 0,
          viewCount: 0,
        });
      });

      it('should apply default values for optional fields', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Azul',
        };

        const result = validateCreateProductInput(input);

        expect(result.isActive).toBe(true);
        expect(result.isHot).toBe(false);
        expect(result.salesCount).toBe(0);
        expect(result.viewCount).toBe(0);
      });

      it('should accept all optional fields when provided', () => {
        const input: CreateProductInput = {
          title: { es: 'Camiseta', en: 'T-Shirt' },
          description: { es: 'Descripción', en: 'Description' },
          slug: 'camiseta',
          price: 25.00,
          compareAtPrice: 35.00,
          availableSizes: ['S', 'M', 'L'],
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Negro',
          isActive: false,
          isHot: true,
        };

        const result = validateCreateProductInput(input);

        expect(result.compareAtPrice).toBe(35.00);
        expect(result.availableSizes).toEqual(['S', 'M', 'L']);
        expect(result.isActive).toBe(false);
        expect(result.isHot).toBe(true);
      });

      it('should trim whitespace from slug', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: '  producto-test  ',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Verde',
        };

        const result = validateCreateProductInput(input);

        expect(result.slug).toBe('producto-test');
      });

      it('should accept title with multiple language keys', () => {
        const input: CreateProductInput = {
          title: { es: 'Camiseta', en: 'T-Shirt', fr: 'T-Shirt' },
          description: { es: 'Descripción' },
          slug: 'camiseta',
          price: 20.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Blanco',
        };

        const result = validateCreateProductInput(input);

        expect(result.title).toEqual({ es: 'Camiseta', en: 'T-Shirt', fr: 'T-Shirt' });
      });
    });

    describe('title validation', () => {
      it('should throw InvalidProductDataError when title is missing', () => {
        const input = {
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input as never)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input as never)).toThrow('Title must be an object');
      });

      it('should throw InvalidProductDataError when title is not an object', () => {
        const input = {
          title: 'string',
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input as never)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input as never)).toThrow('Title must be an object');
      });

      it('should throw InvalidProductDataError when title is missing es key', () => {
        const input: CreateProductInput = {
          title: { en: 'Product' } as never,
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Title must include Spanish translation (es)');
      });

      it('should throw InvalidProductDataError when title.es is empty', () => {
        const input: CreateProductInput = {
          title: { es: '   ' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Title.es cannot be empty');
      });

      it('should throw InvalidProductDataError when title.es exceeds 200 characters', () => {
        const input: CreateProductInput = {
          title: { es: 'a'.repeat(201) },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Title.es exceeds 200 characters');
      });

      it('should accept title.es with exactly 200 characters', () => {
        const input: CreateProductInput = {
          title: { es: 'a'.repeat(200) },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        const result = validateCreateProductInput(input);

        expect(result.title.es).toHaveLength(200);
      });
    });

    describe('description validation', () => {
      it('should throw InvalidProductDataError when description is missing', () => {
        const input = {
          title: { es: 'Producto' },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input as never)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input as never)).toThrow('Description must be an object');
      });

      it('should throw InvalidProductDataError when description is missing es key', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { en: 'Description' } as never,
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Description must include Spanish translation (es)');
      });

      it('should throw InvalidProductDataError when description.es exceeds 1000 characters', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'a'.repeat(1001) },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Description.es exceeds 1000 characters');
      });
    });

    describe('slug validation', () => {
      it('should throw InvalidProductDataError when slug is missing', () => {
        const input = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input as never)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input as never)).toThrow('Slug is required');
      });

      it('should throw InvalidProductDataError when slug contains uppercase', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'Producto-Test',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Slug must be lowercase');
      });

      it('should throw InvalidProductDataError when slug contains spaces', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto test',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Slug must contain only lowercase letters, numbers, and hyphens');
      });

      it('should throw InvalidProductDataError when slug exceeds 100 characters', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'a'.repeat(101),
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Slug exceeds 100 characters');
      });

      it('should accept slug with hyphens and numbers', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto-2024-v2',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        const result = validateCreateProductInput(input);

        expect(result.slug).toBe('producto-2024-v2');
      });
    });

    describe('price validation', () => {
      it('should throw InvalidProductDataError when price is missing', () => {
        const input = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input as never)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input as never)).toThrow('Price is required');
      });

      it('should throw InvalidProductDataError when price is not a number', () => {
        const input = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: '10.00',
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input as never)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input as never)).toThrow('Price must be a number');
      });

      it('should throw InvalidProductDataError when price is zero', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 0,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Price must be greater than 0');
      });

      it('should throw InvalidProductDataError when price is negative', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: -5.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Price must be greater than 0');
      });

      it('should accept price as 0.01', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 0.01,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        const result = validateCreateProductInput(input);

        expect(result.price).toBe(0.01);
      });

      it('should throw InvalidProductDataError when price has more than 2 decimal places', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 29.999,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Price cannot have more than 2 decimal places');
      });

      it('should accept price with exactly 2 decimal places', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 29.99,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        const result = validateCreateProductInput(input);

        expect(result.price).toBe(29.99);
      });
    });

    describe('compareAtPrice validation', () => {
      it('should throw InvalidProductDataError when compareAtPrice is less than price', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 30.00,
          compareAtPrice: 25.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Compare at price must be greater than price');
      });

      it('should throw InvalidProductDataError when compareAtPrice equals price', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 30.00,
          compareAtPrice: 30.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Compare at price must be greater than price');
      });

      it('should accept compareAtPrice when greater than price', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 25.00,
          compareAtPrice: 35.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        const result = validateCreateProductInput(input);

        expect(result.compareAtPrice).toBe(35.00);
      });

      it('should throw InvalidProductDataError when compareAtPrice has more than 2 decimal places', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 25.00,
          compareAtPrice: 35.999,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Compare at price cannot have more than 2 decimal places');
      });
    });

    describe('availableSizes validation', () => {
      it('should throw InvalidProductDataError when availableSizes is not an array', () => {
        const input = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          availableSizes: 'S,M,L',
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input as never)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input as never)).toThrow('Available sizes must be an array');
      });

      it('should throw InvalidProductDataError when availableSizes contains non-string', () => {
        const input = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          availableSizes: ['S', 123, 'L'],
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input as never)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input as never)).toThrow('All sizes must be strings');
      });

      it('should throw InvalidProductDataError when availableSizes contains empty string', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          availableSizes: ['S', '', 'L'],
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('All sizes must be non-empty strings');
      });

      it('should accept valid availableSizes array', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          availableSizes: ['S', 'M', 'L', 'XL'],
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        const result = validateCreateProductInput(input);

        expect(result.availableSizes).toEqual(['S', 'M', 'L', 'XL']);
      });
    });

    describe('productTypeId validation', () => {
      it('should throw InvalidProductDataError when productTypeId is missing', () => {
        const input = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input as never)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input as never)).toThrow('ID is required');
      });

      it('should throw InvalidProductDataError when productTypeId is invalid UUID', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          productTypeId: 'not-a-uuid',
          color: 'Rojo',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Invalid ID format');
      });

      it('should accept valid UUID', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
        };

        const result = validateCreateProductInput(input);

        expect(result.productTypeId).toBe('123e4567-e89b-12d3-a456-426614174000');
      });
    });

    describe('color validation', () => {
      it('should throw InvalidProductDataError when color is missing', () => {
        const input = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
        };

        expect(() => validateCreateProductInput(input as never)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input as never)).toThrow('Color is required');
      });

      it('should throw InvalidProductDataError when color is empty', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: '',
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Color is required');
      });

      it('should throw InvalidProductDataError when color exceeds 50 characters', () => {
        const input: CreateProductInput = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'a'.repeat(51),
        };

        expect(() => validateCreateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input)).toThrow('Color exceeds 50 characters');
      });
    });

    describe('boolean field validation', () => {
      it('should throw InvalidProductDataError when isActive is not boolean', () => {
        const input = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
          isActive: 'true',
        };

        expect(() => validateCreateProductInput(input as never)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input as never)).toThrow('isActive must be a boolean');
      });

      it('should throw InvalidProductDataError when isHot is not boolean', () => {
        const input = {
          title: { es: 'Producto' },
          description: { es: 'Descripción' },
          slug: 'producto',
          price: 10.00,
          productTypeId: '123e4567-e89b-12d3-a456-426614174000',
          color: 'Rojo',
          isHot: 1,
        };

        expect(() => validateCreateProductInput(input as never)).toThrow(InvalidProductDataError);
        expect(() => validateCreateProductInput(input as never)).toThrow('isHot must be a boolean');
      });
    });
  });

  describe('validateUpdateProductInput', () => {
    describe('valid inputs', () => {
      it('should return empty object when no fields provided', () => {
        const input: UpdateProductInput = {};

        const result = validateUpdateProductInput(input);

        expect(result).toEqual({});
      });

      it('should return validated data with partial update', () => {
        const input: UpdateProductInput = {
          title: { es: 'Nuevo Título' },
          price: 35.00,
        };

        const result = validateUpdateProductInput(input);

        expect(result).toEqual({
          title: { es: 'Nuevo Título' },
          price: 35.00,
        });
      });

      it('should return validated data with all fields', () => {
        const input: UpdateProductInput = {
          title: { es: 'Título', en: 'Title' },
          description: { es: 'Descripción', en: 'Description' },
          slug: 'nuevo-slug',
          price: 40.00,
          compareAtPrice: 50.00,
          availableSizes: ['M', 'L'],
          color: 'Azul',
          isActive: false,
          isHot: true,
        };

        const result = validateUpdateProductInput(input);

        expect(result).toMatchObject({
          title: { es: 'Título', en: 'Title' },
          price: 40.00,
          isActive: false,
        });
      });
    });

    describe('validation errors', () => {
      it('should throw InvalidProductDataError when title is invalid', () => {
        const input: UpdateProductInput = {
          title: { en: 'Title' } as never,
        };

        expect(() => validateUpdateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateUpdateProductInput(input)).toThrow('Title must include Spanish translation (es)');
      });

      it('should throw InvalidProductDataError when slug is empty', () => {
        const input: UpdateProductInput = {
          slug: '',
        };

        expect(() => validateUpdateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateUpdateProductInput(input)).toThrow('Slug cannot be empty');
      });

      it('should throw InvalidProductDataError when price is zero', () => {
        const input: UpdateProductInput = {
          price: 0,
        };

        expect(() => validateUpdateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateUpdateProductInput(input)).toThrow('Price must be greater than 0');
      });

      it('should throw InvalidProductDataError when compareAtPrice is less than or equal to price', () => {
        const input: UpdateProductInput = {
          price: 30.00,
          compareAtPrice: 30.00,
        };

        expect(() => validateUpdateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateUpdateProductInput(input)).toThrow('Compare at price must be greater than price');
      });

      it('should accept compareAtPrice without price in update (cross-validation happens in service)', () => {
        const input: UpdateProductInput = {
          compareAtPrice: 50.00,
        };

        const result = validateUpdateProductInput(input);

        expect(result.compareAtPrice).toBe(50.00);
      });

      it('should throw InvalidProductDataError when price has more than 2 decimal places in update', () => {
        const input: UpdateProductInput = {
          price: 29.999,
        };

        expect(() => validateUpdateProductInput(input)).toThrow(InvalidProductDataError);
        expect(() => validateUpdateProductInput(input)).toThrow('Price cannot have more than 2 decimal places');
      });
    });
  });

  describe('validateProductId', () => {
    it('should return valid UUID', () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';

      const result = validateProductId(id);

      expect(result).toBe(id);
    });

    it('should accept UUID in uppercase', () => {
      const id = '123E4567-E89B-12D3-A456-426614174000';

      const result = validateProductId(id);

      expect(result).toBe(id);
    });

    it('should throw InvalidProductDataError when ID is not UUID', () => {
      expect(() => validateProductId('not-a-uuid')).toThrow(InvalidProductDataError);
      expect(() => validateProductId('not-a-uuid')).toThrow('Invalid ID format');
    });

    it('should throw InvalidProductDataError when ID is empty', () => {
      expect(() => validateProductId('')).toThrow(InvalidProductDataError);
      expect(() => validateProductId('')).toThrow('ID is required');
    });
  });
});
