import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageGallery } from './ImageGallery';
import { createProductImage, createProductImages } from './testing/fixtures';

// Mock next/image (filter out next/image-specific props that aren't valid HTML attributes)
jest.mock('next/image', () => {
  return function MockImage({ fill, sizes, ...props }: Record<string, unknown>) {
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ImageOff: (props: Record<string, unknown>) => <svg data-testid="image-off-icon" {...props} />,
  ChevronLeft: (props: Record<string, unknown>) => <svg data-testid="chevron-left-icon" {...props} />,
  ChevronRight: (props: Record<string, unknown>) => <svg data-testid="chevron-right-icon" {...props} />,
}));

describe('ImageGallery - No Images Placeholder', () => {
  it('should render placeholder with ImageOff icon when images is empty array', () => {
    render(<ImageGallery images={[]} />);
    expect(screen.getByTestId('image-off-icon')).toBeInTheDocument();
    expect(screen.getByLabelText('No product images')).toBeInTheDocument();
  });

  it('should render placeholder when images is undefined', () => {
    render(<ImageGallery images={undefined} />);
    expect(screen.getByTestId('image-off-icon')).toBeInTheDocument();
    expect(screen.getByLabelText('No product images')).toBeInTheDocument();
  });
});

describe('ImageGallery - Single Image', () => {
  it('should render main image with next/image when single image provided', () => {
    const images = createProductImages(1);
    render(<ImageGallery images={images} />);
    const img = screen.getByAltText('Product image 1');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', images[0].url);
  });

  it('should not render thumbnail strip when only one image', () => {
    const images = createProductImages(1);
    render(<ImageGallery images={images} />);
    // No thumbnail buttons should exist
    expect(screen.queryByRole('button', { name: /image/i })).not.toBeInTheDocument();
  });

  it('should not render navigation arrows when only one image', () => {
    const images = createProductImages(1);
    render(<ImageGallery images={images} />);
    expect(screen.queryByTestId('chevron-left-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
  });
});

describe('ImageGallery - Multiple Images', () => {
  it('should render main image as the first image (sorted by sortOrder)', () => {
    const images = createProductImages(3);
    render(<ImageGallery images={images} />);
    // First image should be displayed (sortOrder: 0)
    const allImagesWithAlt = screen.getAllByAltText('Product image 1');
    // First one should be the main image (no width/height attributes from fill prop)
    const mainImg = allImagesWithAlt[0];
    expect(mainImg).toBeInTheDocument();
    expect(mainImg).toHaveAttribute('src', images[0].url);
    expect(mainImg).not.toHaveAttribute('width');
  });

  it('should render thumbnail strip with all images', () => {
    const images = createProductImages(3);
    render(<ImageGallery images={images} />);
    // Should have 3 thumbnail buttons
    const thumbnails = screen.getAllByRole('button', { name: /thumbnail/i });
    expect(thumbnails).toHaveLength(3);
  });

  it('should render thumbnails inside a strip container', () => {
    const images = createProductImages(3);
    const { container } = render(<ImageGallery images={images} />);
    // Check for thumbnail strip container (can be identified by presence of multiple thumbnail buttons)
    const thumbnails = screen.getAllByRole('button', { name: /thumbnail/i });
    expect(thumbnails.length).toBe(3);
    // Verify each thumbnail contains an image
    thumbnails.forEach((thumbnail, index) => {
      const img = thumbnail.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', images[index].url);
    });
  });
});

describe('ImageGallery - Thumbnail Click Interaction', () => {
  it('should change main image when thumbnail is clicked', async () => {
    const user = userEvent.setup();
    const images = createProductImages(3);
    render(<ImageGallery images={images} />);

    // Initially showing first image
    let mainImages = screen.getAllByAltText('Product image 1');
    expect(mainImages[0]).not.toHaveAttribute('width');

    // Click second thumbnail
    const secondThumbnail = screen.getByRole('button', { name: 'Thumbnail 2' });
    await user.click(secondThumbnail);

    // Main image should now be second image
    mainImages = screen.getAllByAltText('Product image 2');
    expect(mainImages[0]).not.toHaveAttribute('width');
  });

  it('should highlight the active thumbnail with a ring', async () => {
    const user = userEvent.setup();
    const images = createProductImages(3);
    render(<ImageGallery images={images} />);

    const firstThumbnail = screen.getByRole('button', { name: 'Thumbnail 1' });
    const secondThumbnail = screen.getByRole('button', { name: 'Thumbnail 2' });

    // First thumbnail should be active initially
    expect(firstThumbnail).toHaveClass('ring-2');
    expect(firstThumbnail).toHaveClass('ring-primary');
    expect(secondThumbnail).not.toHaveClass('ring-2');

    // Click second thumbnail
    await user.click(secondThumbnail);

    // Second thumbnail should now be active
    expect(secondThumbnail).toHaveClass('ring-2');
    expect(secondThumbnail).toHaveClass('ring-primary');
    expect(firstThumbnail).not.toHaveClass('ring-2');
  });
});

describe('ImageGallery - Previous/Next Navigation Buttons', () => {
  it('should render previous and next buttons when multiple images', () => {
    const images = createProductImages(3);
    render(<ImageGallery images={images} />);

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('should disable previous button when on first image', () => {
    const images = createProductImages(3);
    render(<ImageGallery images={images} />);

    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button when on last image', async () => {
    const user = userEvent.setup();
    const images = createProductImages(3);
    render(<ImageGallery images={images} />);

    const nextButton = screen.getByRole('button', { name: /next/i });

    // Click next twice to reach last image
    await user.click(nextButton);
    await user.click(nextButton);

    expect(nextButton).toBeDisabled();
  });

  it('should navigate to next image on next button click', async () => {
    const user = userEvent.setup();
    const images = createProductImages(3);
    render(<ImageGallery images={images} />);

    const nextButton = screen.getByRole('button', { name: /next/i });

    // Click next button
    await user.click(nextButton);

    // Second image should now be main
    const mainImages = screen.getAllByAltText('Product image 2');
    expect(mainImages[0]).not.toHaveAttribute('width');
  });

  it('should navigate to previous image on previous button click', async () => {
    const user = userEvent.setup();
    const images = createProductImages(3);
    render(<ImageGallery images={images} />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    const prevButton = screen.getByRole('button', { name: /previous/i });

    // First navigate to second image
    await user.click(nextButton);

    // Then navigate back to first
    await user.click(prevButton);

    // First image should now be main
    const mainImages = screen.getAllByAltText('Product image 1');
    expect(mainImages[0]).not.toHaveAttribute('width');
  });
});

describe('ImageGallery - Keyboard Navigation', () => {
  it('should navigate to next image on ArrowRight key', async () => {
    const user = userEvent.setup();
    const images = createProductImages(3);
    render(<ImageGallery images={images} />);

    const gallery = screen.getByRole('region', { name: /product image gallery/i });

    // Press ArrowRight
    await user.type(gallery, '{ArrowRight}');

    // Second image should now be main
    const mainImages = screen.getAllByAltText('Product image 2');
    expect(mainImages[0]).not.toHaveAttribute('width');
  });

  it('should navigate to previous image on ArrowLeft key', async () => {
    const user = userEvent.setup();
    const images = createProductImages(3);
    render(<ImageGallery images={images} />);

    const gallery = screen.getByRole('region', { name: /product image gallery/i });

    // First navigate to second image with ArrowRight
    await user.type(gallery, '{ArrowRight}');

    // Then navigate back with ArrowLeft
    await user.type(gallery, '{ArrowLeft}');

    // First image should now be main
    const mainImages = screen.getAllByAltText('Product image 1');
    expect(mainImages[0]).not.toHaveAttribute('width');
  });

  it('should not go below 0 on ArrowLeft at first image', async () => {
    const user = userEvent.setup();
    const images = createProductImages(3);
    render(<ImageGallery images={images} />);

    const gallery = screen.getByRole('region', { name: /product image gallery/i });

    // Try to navigate left from first image
    await user.type(gallery, '{ArrowLeft}');

    // Should still be on first image
    const mainImages = screen.getAllByAltText('Product image 1');
    expect(mainImages[0]).not.toHaveAttribute('width');
  });

  it('should not go past last image on ArrowRight at last image', async () => {
    const user = userEvent.setup();
    const images = createProductImages(3);
    render(<ImageGallery images={images} />);

    const gallery = screen.getByRole('region', { name: /product image gallery/i });

    // Navigate to last image
    await user.type(gallery, '{ArrowRight}{ArrowRight}');

    // Try to navigate right from last image
    await user.type(gallery, '{ArrowRight}');

    // Should still be on last image
    const mainImages = screen.getAllByAltText('Product image 3');
    expect(mainImages[0]).not.toHaveAttribute('width');
  });
});

describe('ImageGallery - Sort Order', () => {
  it('should sort images by sortOrder ascending', () => {
    const images = [
      createProductImage({ id: 'img-1', sortOrder: 2, altText: 'Image C' }),
      createProductImage({ id: 'img-2', sortOrder: 0, altText: 'Image A' }),
      createProductImage({ id: 'img-3', sortOrder: 1, altText: 'Image B' }),
    ];
    render(<ImageGallery images={images} />);

    // First image should be the one with sortOrder: 0
    const mainImages = screen.getAllByAltText('Image A');
    expect(mainImages[0]).not.toHaveAttribute('width');

    // Verify thumbnail order
    const thumbnails = screen.getAllByRole('button', { name: /thumbnail/i });
    const firstThumbnailImg = thumbnails[0].querySelector('img');
    expect(firstThumbnailImg).toHaveAttribute('alt', 'Image A');

    const secondThumbnailImg = thumbnails[1].querySelector('img');
    expect(secondThumbnailImg).toHaveAttribute('alt', 'Image B');

    const thirdThumbnailImg = thumbnails[2].querySelector('img');
    expect(thirdThumbnailImg).toHaveAttribute('alt', 'Image C');
  });

  it('should use isPrimary as tiebreaker when sortOrder is equal', () => {
    const images = [
      createProductImage({ id: 'img-1', sortOrder: 1, isPrimary: false, altText: 'Image B' }),
      createProductImage({ id: 'img-2', sortOrder: 1, isPrimary: true, altText: 'Image A' }),
      createProductImage({ id: 'img-3', sortOrder: 2, isPrimary: false, altText: 'Image C' }),
    ];
    render(<ImageGallery images={images} />);

    // First image should be the one with isPrimary: true
    const mainImages = screen.getAllByAltText('Image A');
    expect(mainImages[0]).not.toHaveAttribute('width');

    // Verify thumbnail order
    const thumbnails = screen.getAllByRole('button', { name: /thumbnail/i });
    const firstThumbnailImg = thumbnails[0].querySelector('img');
    expect(firstThumbnailImg).toHaveAttribute('alt', 'Image A');
  });

  it('should treat undefined sortOrder as Infinity (sort to end)', () => {
    const images = [
      createProductImage({ id: 'img-1', sortOrder: undefined, altText: 'Image C' }),
      createProductImage({ id: 'img-2', sortOrder: 1, altText: 'Image A' }),
      createProductImage({ id: 'img-3', sortOrder: 2, altText: 'Image B' }),
    ];
    render(<ImageGallery images={images} />);

    const thumbnails = screen.getAllByRole('button', { name: /thumbnail/i });
    expect(thumbnails[0].querySelector('img')).toHaveAttribute('alt', 'Image A');
    expect(thumbnails[1].querySelector('img')).toHaveAttribute('alt', 'Image B');
    expect(thumbnails[2].querySelector('img')).toHaveAttribute('alt', 'Image C');
  });
});

describe('ImageGallery - Accessibility', () => {
  it('should use altText from ProductImage for main image', () => {
    const images = [createProductImage({ altText: 'Custom alt text for product' })];
    render(<ImageGallery images={images} />);

    const img = screen.getByAltText('Custom alt text for product');
    expect(img).toBeInTheDocument();
  });

  it('should fall back to empty string alt when altText is undefined', () => {
    const images = [createProductImage({ altText: undefined })];
    render(<ImageGallery images={images} />);

    const img = screen.getByAltText('');
    expect(img).toBeInTheDocument();
  });

  it('should handle undefined url gracefully', () => {
    const images = [createProductImage({ url: undefined })];
    // Should render without crashing
    const { container } = render(<ImageGallery images={images} />);
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('should have role="region" and aria-label on gallery container', () => {
    const images = createProductImages(2);
    render(<ImageGallery images={images} />);

    const gallery = screen.getByRole('region', { name: 'Product image gallery' });
    expect(gallery).toBeInTheDocument();
  });

  it('should apply custom className to the root element', () => {
    const images = createProductImages(1);
    const { container } = render(<ImageGallery images={images} className="custom-gallery-class" />);

    const rootElement = container.firstChild;
    expect(rootElement).toHaveClass('custom-gallery-class');
  });
});
