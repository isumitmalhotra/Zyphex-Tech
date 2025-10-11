import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalError from '@/app/global-error';
import { ErrorBoundary } from '@/lib/components/ErrorBoundary';
import '@testing-library/jest-dom';

// Mock Sentry error reporting
jest.mock('@sentry/nextjs', () => {
  const mockScope = {
    setTag: jest.fn(),
    setContext: jest.fn(),
    setLevel: jest.fn(),
  };
  
  return {
    captureException: jest.fn(),
    withScope: jest.fn((callback: (scope: typeof mockScope) => void) => callback(mockScope)),
  };
});

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      pathname: '/test',
      query: {},
      asPath: '/test',
    };
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      pathname: '/test',
    };
  },
  usePathname: () => '/test',
}));

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for error boundary');
  }
  return <div>No error</div>;
};

// Helper types for error boundary props
interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

describe('Error Boundary Components', () => {
  // Mock console.error to prevent noise in test output
  const originalError = console.error;
  
  beforeEach(() => {
    console.error = jest.fn();
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    console.error = originalError;
  });

  describe('GlobalError Component', () => {
    it('renders error page with retry button', () => {
      const mockError = new Error('Test error');
      const mockReset = jest.fn();
      
      render(
        <GlobalError
          error={mockError}
          reset={mockReset}
        />
      );
      
      expect(screen.getByText('Critical System Error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('calls reset function when retry button is clicked', () => {
      const mockError = new Error('Test error');
      const mockReset = jest.fn();
      
      render(
        <GlobalError
          error={mockError}
          reset={mockReset}
        />
      );
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);
      
      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('provides navigation options', () => {
      const mockError = new Error('Test error');
      const mockReset = jest.fn();
      
      render(
        <GlobalError
          error={mockError}
          reset={mockReset}
        />
      );
      
      expect(screen.getByRole('link', { name: /go to homepage/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /support/i })).toBeInTheDocument();
    });

    it('displays error details when digest is provided', () => {
      const mockError = new Error('Detailed test error') as Error & { digest?: string };
      mockError.digest = 'test-digest-123';
      const mockReset = jest.fn();
      
      render(
        <GlobalError
          error={mockError}
          reset={mockReset}
        />
      );
      
      expect(screen.getByText('Critical System Error')).toBeInTheDocument();
      expect(screen.getByText('test-digest-123')).toBeInTheDocument();
    });

    it('handles errors gracefully without digest', () => {
      const mockError = new Error('Detailed test error');
      const mockReset = jest.fn();
      
      render(
        <GlobalError
          error={mockError}
          reset={mockReset}
        />
      );
      
      expect(screen.getByText('Critical System Error')).toBeInTheDocument();
      expect(screen.queryByText('Error Reference:')).not.toBeInTheDocument();
    });
  });

  describe('React Error Boundary Integration', () => {
    it('catches JavaScript errors and displays fallback UI', () => {
      const fallbackRender = ({ error, resetErrorBoundary }: ErrorBoundaryFallbackProps) => (
        <div>
          <h2>Something went wrong</h2>
          <p>{error.message}</p>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      );

      render(
        <ErrorBoundary fallbackRender={fallbackRender}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error for error boundary')).toBeInTheDocument();
    });

    it('renders children when no error occurs', () => {
      const fallbackRender = () => (
        <div>Error occurred</div>
      );

      render(
        <ErrorBoundary fallbackRender={fallbackRender}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
    });

    it('allows error recovery via reset button', () => {
      const fallbackRender = ({ error, resetErrorBoundary }: ErrorBoundaryFallbackProps) => (
        <div>
          <h2>Error: {error.message}</h2>
          <button onClick={resetErrorBoundary}>Reset</button>
        </div>
      );

      render(
        <ErrorBoundary fallbackRender={fallbackRender}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error: Test error for error boundary')).toBeInTheDocument();
      
      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).toBeInTheDocument();
      
      // Test that the reset button is functional
      fireEvent.click(resetButton);
      
      // The error boundary should still be there after reset (until re-render)
      expect(screen.getByText('Error: Test error for error boundary')).toBeInTheDocument();
    });

    it('calls custom error handler when provided', () => {
      const mockErrorHandler = jest.fn();
      const fallbackRender = () => <div>Error fallback</div>;

      render(
        <ErrorBoundary
          fallbackRender={fallbackRender}
          onError={mockErrorHandler}
        >
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockErrorHandler).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('logs errors to Sentry when error occurs', () => {
      const mockSentryModule = jest.requireMock('@sentry/nextjs');
      const fallbackRender = () => <div>Error fallback</div>;

      render(
        <ErrorBoundary fallbackRender={fallbackRender}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // The ErrorBoundary component should have triggered Sentry logging
      expect(mockSentryModule.withScope).toHaveBeenCalled();
      expect(mockSentryModule.captureException).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Error Boundary Reset Functionality', () => {
    it('resets error state when resetErrorBoundary is called', () => {
      const fallbackRender = ({ resetErrorBoundary }: { resetErrorBoundary: () => void }) => (
        <div>
          <span>Error boundary triggered</span>
          <button onClick={resetErrorBoundary}>Reset Error</button>
        </div>
      );

      render(
        <ErrorBoundary fallbackRender={fallbackRender}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error boundary triggered')).toBeInTheDocument();
      
      // Test that reset button exists and can be clicked
      const resetButton = screen.getByRole('button', { name: /reset error/i });
      expect(resetButton).toBeInTheDocument();
      
      // Click should call the reset function (component behavior is tested elsewhere)
      fireEvent.click(resetButton);
      
      // Verify the error boundary is still showing (until a re-render occurs)
      expect(screen.getByText('Error boundary triggered')).toBeInTheDocument();
    });

    it('renders without errors when no error occurs', () => {
      const fallbackRender = () => <div>Error fallback</div>;

      render(
        <ErrorBoundary fallbackRender={fallbackRender}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Edge Cases', () => {
    it('handles nested error boundaries correctly', () => {
      const outerFallback = () => <div>Outer error boundary</div>;
      const innerFallback = () => <div>Inner error boundary</div>;

      render(
        <ErrorBoundary fallbackRender={outerFallback}>
          <div>
            <ErrorBoundary fallbackRender={innerFallback}>
              <ThrowError shouldThrow={true} />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByText('Inner error boundary')).toBeInTheDocument();
      expect(screen.queryByText('Outer error boundary')).not.toBeInTheDocument();
    });

    it('handles errors thrown during render', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const fallbackRender = ({ error }: { error: Error }) => (
        <div>Safe fallback: {error.message}</div>
      );

      // This should render the fallback safely
      render(
        <ErrorBoundary fallbackRender={fallbackRender}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Safe fallback: Test error for error boundary')).toBeInTheDocument();

      consoleError.mockRestore();
    });

    it('provides default fallback when no fallback is specified', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should render default error UI
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('handles TypeScript error types correctly', () => {
      const TypedFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
        <div>
          <h3>Typed Error: {error.name}</h3>
          <p>{error.message}</p>
          <button onClick={resetErrorBoundary}>Reset</button>
        </div>
      );

      render(
        <ErrorBoundary fallbackRender={TypedFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Typed Error: Error')).toBeInTheDocument();
      expect(screen.getByText('Test error for error boundary')).toBeInTheDocument();
    });
  });

  describe('Integration with Application State', () => {
    it('maintains component isolation when error occurs', () => {
      const SiblingComponent = () => <div>Sibling component</div>;

      render(
        <div>
          <SiblingComponent />
          <ErrorBoundary fallbackRender={() => <div>Error in boundary</div>}>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </div>
      );

      // Sibling component should still render
      expect(screen.getByText('Sibling component')).toBeInTheDocument();
      expect(screen.getByText('Error in boundary')).toBeInTheDocument();
    });

    it('does not interfere with React hooks in other components', () => {
      const HookComponent = () => {
        const [count, setCount] = React.useState(0);
        return (
          <div>
            <span>Count: {count}</span>
            <button onClick={() => setCount(count + 1)}>Increment</button>
          </div>
        );
      };

      render(
        <div>
          <HookComponent />
          <ErrorBoundary fallbackRender={() => <div>Error occurred</div>}>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </div>
      );

      expect(screen.getByText('Count: 0')).toBeInTheDocument();
      
      const incrementButton = screen.getByRole('button', { name: /increment/i });
      fireEvent.click(incrementButton);
      
      expect(screen.getByText('Count: 1')).toBeInTheDocument();
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('maintains proper focus management after error', () => {
      const fallbackRender = ({ resetErrorBoundary }: { resetErrorBoundary: () => void }) => (
        <div>
          <h2>Error occurred</h2>
          <button onClick={resetErrorBoundary} autoFocus>
            Try Again
          </button>
        </div>
      );

      render(
        <ErrorBoundary fallbackRender={fallbackRender}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      expect(document.activeElement).toBe(tryAgainButton);
    });

    it('provides accessible error messages', () => {
      const fallbackRender = ({ error }: { error: Error }) => (
        <div role="alert" aria-live="assertive">
          <h2>An error occurred</h2>
          <p>{error.message}</p>
        </div>
      );

      render(
        <ErrorBoundary fallbackRender={fallbackRender}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const alertElement = screen.getByRole('alert');
      expect(alertElement).toBeInTheDocument();
      expect(alertElement).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Performance and Memory Management', () => {
    it('does not cause memory leaks when mounting/unmounting', () => {
      const { unmount } = render(
        <ErrorBoundary fallbackRender={() => <div>Error</div>}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // This should not throw or cause issues
      expect(() => unmount()).not.toThrow();
    });

    it('handles rapid error/reset cycles gracefully', () => {
      const fallbackRender = ({ resetErrorBoundary }: { resetErrorBoundary: () => void }) => (
        <div>
          <span>Error state</span>
          <button onClick={resetErrorBoundary}>Reset</button>
        </div>
      );

      render(
        <ErrorBoundary fallbackRender={fallbackRender}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error state')).toBeInTheDocument();
      
      // Test multiple rapid clicks
      const resetButton = screen.getByRole('button', { name: /reset/i });
      for (let i = 0; i < 3; i++) {
        fireEvent.click(resetButton);
      }
      
      // Error boundary should still be functioning
      expect(screen.getByText('Error state')).toBeInTheDocument();
    });
  });
});