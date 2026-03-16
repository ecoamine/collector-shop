import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Hello</Badge>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    const { container } = render(<Badge>X</Badge>);
    const span = container.querySelector('span');
    expect(span).toHaveClass('bg-surface-600');
  });

  it('applies primary variant', () => {
    const { container } = render(<Badge variant="primary">P</Badge>);
    const span = container.querySelector('span');
    expect(span).toHaveClass('bg-primary/20');
  });

  it('applies danger variant', () => {
    const { container } = render(<Badge variant="danger">D</Badge>);
    const span = container.querySelector('span');
    expect(span).toHaveClass('bg-danger/20');
  });

  it('merges className', () => {
    const { container } = render(<Badge className="custom">C</Badge>);
    const span = container.querySelector('span');
    expect(span).toHaveClass('custom');
  });
});
