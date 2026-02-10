import { render, screen } from '@testing-library/react';
import { ButtonGroupSkeleton } from './button-group-skeleton';

describe('ButtonGroupSkeleton', () => {
  it('should render 3 skeleton items by default', () => {
    render(<ButtonGroupSkeleton />);

    const container = screen.getByRole('status');
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(3);
  });

  it('should render the specified number of skeleton items', () => {
    render(<ButtonGroupSkeleton count={5} />);

    const container = screen.getByRole('status');
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(5);
  });

  it('should have role="status" and aria-live="polite"', () => {
    render(<ButtonGroupSkeleton />);

    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('should render default sr-only loading text', () => {
    render(<ButtonGroupSkeleton />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toHaveClass('sr-only');
  });

  it('should render custom sr-only label', () => {
    render(<ButtonGroupSkeleton label="Loading product types..." />);

    expect(screen.getByText('Loading product types...')).toBeInTheDocument();
  });

  it('should apply custom className to container', () => {
    render(<ButtonGroupSkeleton className="my-custom-class" />);

    const container = screen.getByRole('status');
    expect(container).toHaveClass('my-custom-class');
  });

  it('should have default flex gap-2 styling', () => {
    render(<ButtonGroupSkeleton />);

    const container = screen.getByRole('status');
    expect(container).toHaveClass('flex', 'gap-2');
  });
});
