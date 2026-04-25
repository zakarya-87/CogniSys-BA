
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';
import React from 'react';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Success</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('renders error UI when an error occurs', () => {
    // Suppress console.error for this test
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    
    vi.restoreAllMocks();
  });
});
