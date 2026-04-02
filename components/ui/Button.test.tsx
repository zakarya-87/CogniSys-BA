
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Button } from './Button';

describe('Button Component', () => {
    it('renders children correctly', () => {
        render(<Button>Click Me</Button>);
        expect(screen.getByText('Click Me')).toBeDefined();
    });

    it('handles onClick events', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Action</Button>);
        fireEvent.click(screen.getByText('Action'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies disabled state', () => {
        render(<Button disabled>Disabled</Button>);
        const btn = screen.getByText('Disabled').closest('button');
        expect(btn?.hasAttribute('disabled')).toBe(true);
    });

    it('renders with custom class names', () => {
        const { container } = render(<Button className="custom-class">Test</Button>);
        expect(container.firstChild).toHaveProperty('className', expect.stringContaining('custom-class'));
    });
});
