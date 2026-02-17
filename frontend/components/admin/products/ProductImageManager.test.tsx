import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductImageManager } from './ProductImageManager';
import { adminProductService } from '@/lib/services/adminProductService';
import { createProductImage, createProductImages } from '@/components/product/testing/fixtures';
import type { components } from '@/lib/api/types';

type ProductImage = components['schemas']['ProductImage'];

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

// Mock adminProductService
jest.mock('../../../lib/services/adminProductService', () => ({
  adminProductService: {
    addImage: jest.fn(),
    updateImage: jest.fn(),
    deleteImage: jest.fn(),
  },
}));

const mockAdminProductService = adminProductService as jest.Mocked<typeof adminProductService>;

describe('ProductImageManager', () => {
  const productId = 'prod-1';
  const mockOnImagesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render each image thumbnail', () => {
    const images = createProductImages(3);

    render(
      <ProductImageManager
        productId={productId}
        images={images}
        onImagesChange={mockOnImagesChange}
      />
    );

    expect(screen.getByAltText('Product image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Product image 2')).toBeInTheDocument();
    expect(screen.getByAltText('Product image 3')).toBeInTheDocument();
  });

  it('should show primary badge on primary image', () => {
    const images = createProductImages(2);

    render(
      <ProductImageManager
        productId={productId}
        images={images}
        onImagesChange={mockOnImagesChange}
      />
    );

    // First image is primary in the fixture
    const badges = screen.getAllByText('Primary');
    expect(badges).toHaveLength(1);
  });

  it('should show empty state when no images', () => {
    render(
      <ProductImageManager
        productId={productId}
        images={[]}
        onImagesChange={mockOnImagesChange}
      />
    );

    expect(screen.getByText('No images yet')).toBeInTheDocument();
  });

  it('should show URL input when "Add Image" is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ProductImageManager
        productId={productId}
        images={[]}
        onImagesChange={mockOnImagesChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /add image/i }));

    expect(screen.getByPlaceholderText(/image url/i)).toBeInTheDocument();
  });

  it('should call addImage and onImagesChange when adding an image', async () => {
    const user = userEvent.setup();
    const newImage = createProductImage({ id: 'img-new', sortOrder: 0, isPrimary: true });
    mockAdminProductService.addImage.mockResolvedValueOnce(newImage);

    render(
      <ProductImageManager
        productId={productId}
        images={[]}
        onImagesChange={mockOnImagesChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /add image/i }));
    await user.type(screen.getByPlaceholderText(/image url/i), 'https://example.com/img.jpg');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(mockAdminProductService.addImage).toHaveBeenCalledWith(productId, {
        url: 'https://example.com/img.jpg',
        isPrimary: true,
        sortOrder: 0,
      });
    });

    expect(mockOnImagesChange).toHaveBeenCalledWith([newImage]);
  });

  it('should disable Add button when URL input is empty', async () => {
    const user = userEvent.setup();

    render(
      <ProductImageManager
        productId={productId}
        images={[]}
        onImagesChange={mockOnImagesChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /add image/i }));

    expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled();
  });

  it('should call deleteImage and onImagesChange when deleting an image', async () => {
    const user = userEvent.setup();
    const images = createProductImages(2);
    mockAdminProductService.deleteImage.mockResolvedValueOnce();

    render(
      <ProductImageManager
        productId={productId}
        images={images}
        onImagesChange={mockOnImagesChange}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockAdminProductService.deleteImage).toHaveBeenCalledWith(productId, 'img-1');
    });

    expect(mockOnImagesChange).toHaveBeenCalledWith([images[1]]);
  });

  it('should call updateImage and onImagesChange when setting primary', async () => {
    const user = userEvent.setup();
    const images = [
      createProductImage({ id: 'img-1', isPrimary: true, sortOrder: 0 }),
      createProductImage({ id: 'img-2', isPrimary: false, sortOrder: 1 }),
    ];
    const updatedImage = { ...images[1], isPrimary: true };
    mockAdminProductService.updateImage.mockResolvedValueOnce(updatedImage);

    render(
      <ProductImageManager
        productId={productId}
        images={images}
        onImagesChange={mockOnImagesChange}
      />
    );

    const setPrimaryButtons = screen.getAllByRole('button', { name: /set primary/i });
    await user.click(setPrimaryButtons[0]);

    await waitFor(() => {
      expect(mockAdminProductService.updateImage).toHaveBeenCalledWith(
        productId,
        'img-2',
        { isPrimary: true }
      );
    });

    expect(mockOnImagesChange).toHaveBeenCalledWith([
      { ...images[0], isPrimary: false },
      { ...images[1], isPrimary: true },
    ]);
  });

  it('should show error message when add image fails', async () => {
    const user = userEvent.setup();
    mockAdminProductService.addImage.mockRejectedValueOnce(new Error('Upload failed'));

    render(
      <ProductImageManager
        productId={productId}
        images={[]}
        onImagesChange={mockOnImagesChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /add image/i }));
    await user.type(screen.getByPlaceholderText(/image url/i), 'https://example.com/img.jpg');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Upload failed');
    });
  });
});
