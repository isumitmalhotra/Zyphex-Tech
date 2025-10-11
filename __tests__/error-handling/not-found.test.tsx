/**
 * Unit Tests for Not Found Page Error Handling
 * 
 * Tests the 404 error page functionality including:
 * - Component rendering and accessibility
 * - Search functionality and form handling
 * - Navigation and redirect behaviors
 * - TypeScript compliance and error boundaries
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import NotFound from '@/app/not-found';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

describe('NotFound Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Component Rendering', () => {
    it('renders the 404 page correctly', () => {
      render(<NotFound />);
      
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText(/The page you're looking for doesn't exist/)).toBeInTheDocument();
    });

    it('displays the search form', () => {
      render(<NotFound />);
      
      const searchInput = screen.getByPlaceholderText(/Search for pages, services, or help/);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      expect(searchInput).toBeInTheDocument();
      expect(searchButton).toBeInTheDocument();
    });

    it('displays navigation links', () => {
      render(<NotFound />);
      
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /services/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /help center/i })).toBeInTheDocument();
    });

    it('displays helpful suggestions', () => {
      render(<NotFound />);
      
      expect(screen.getByText(/What can you do\?/)).toBeInTheDocument();
      expect(screen.getByText(/Check the URL for typos/)).toBeInTheDocument();
      expect(screen.getByText(/Use our search function/)).toBeInTheDocument();
      expect(screen.getByText(/Browse our main sections/)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('handles search input changes', async () => {
      render(<NotFound />);
      
      const searchInput = screen.getByPlaceholderText(/Search for pages, services, or help/);
      
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('test query');
      });
    });

    it('handles search form submission with valid query', async () => {
      render(<NotFound />);
      
      const searchInput = screen.getByPlaceholderText(/Search for pages, services, or help/);
      const searchForm = searchInput.closest('form');
      
      fireEvent.change(searchInput, { target: { value: 'dashboard' } });
      fireEvent.submit(searchForm!);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/search?q=dashboard');
      });
    });

    it('handles search form submission with empty query', async () => {
      render(<NotFound />);
      
      const searchInput = screen.getByPlaceholderText(/Search for pages, services, or help/);
      const searchForm = searchInput.closest('form');
      
      fireEvent.submit(searchForm!);
      
      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled();
      });
    });

    it('trims whitespace from search queries', async () => {
      render(<NotFound />);
      
      const searchInput = screen.getByPlaceholderText(/Search for pages, services, or help/);
      const searchForm = searchInput.closest('form');
      
      fireEvent.change(searchInput, { target: { value: '  trimmed query  ' } });
      fireEvent.submit(searchForm!);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/search?q=trimmed query');
      });
    });

    it('handles special characters in search queries', async () => {
      render(<NotFound />);
      
      const searchInput = screen.getByPlaceholderText(/Search for pages, services, or help/);
      const searchForm = searchInput.closest('form');
      
      fireEvent.change(searchInput, { target: { value: 'test@query#special' } });
      fireEvent.submit(searchForm!);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/search?q=test@query#special');
      });
    });
  });

  describe('Navigation Behavior', () => {
    it('contains correct navigation links', () => {
      render(<NotFound />);
      
      const homeLink = screen.getByRole('link', { name: /home/i });
      const servicesLink = screen.getByRole('link', { name: /services/i });
      const contactLink = screen.getByRole('link', { name: /contact/i });
      const helpLink = screen.getByRole('link', { name: /help center/i });
      
      expect(homeLink).toHaveAttribute('href', '/');
      expect(servicesLink).toHaveAttribute('href', '/services');
      expect(contactLink).toHaveAttribute('href', '/contact');
      expect(helpLink).toHaveAttribute('href', '/help');
    });

    it('has accessible navigation elements', () => {
      render(<NotFound />);
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
      expect(navigation).toHaveAttribute('aria-label', 'Quick navigation');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<NotFound />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      const subHeading = screen.getByRole('heading', { level: 2 });
      
      expect(mainHeading).toBeInTheDocument();
      expect(subHeading).toBeInTheDocument();
    });

    it('has proper form labels and accessibility attributes', () => {
      render(<NotFound />);
      
      const searchInput = screen.getByPlaceholderText(/Search for pages, services, or help/);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      expect(searchInput).toHaveAttribute('type', 'text');
      expect(searchInput).toHaveAttribute('aria-label');
      expect(searchButton).toHaveAttribute('type', 'submit');
    });

    it('provides screen reader friendly content', () => {
      render(<NotFound />);
      
      // Check for screen reader only content
      const srContent = screen.getByText(/This page could not be found/);
      expect(srContent).toBeInTheDocument();
    });

    it('has proper ARIA landmarks', () => {
      render(<NotFound />);
      
      const main = screen.getByRole('main');
      const navigation = screen.getByRole('navigation');
      
      expect(main).toBeInTheDocument();
      expect(navigation).toBeInTheDocument();
    });
  });

  describe('Error Boundary Integration', () => {
    it('handles render errors gracefully', () => {
      // Mock console.error to prevent noise in test output
      const originalError = console.error;
      console.error = jest.fn();
      
      // This test would need an ErrorBoundary wrapper to properly test
      // For now, we ensure the component renders without throwing
      expect(() => render(<NotFound />)).not.toThrow();
      
      console.error = originalError;
    });
  });

  describe('TypeScript Compliance', () => {
    it('handles form events with proper typing', async () => {
      render(<NotFound />);
      
      const searchInput = screen.getByPlaceholderText(/Search for pages, services, or help/);
      const searchForm = searchInput.closest('form');
      
      // Test that TypeScript-compliant event handling works
      fireEvent.change(searchInput, { target: { value: 'typescript test' } });
      fireEvent.submit(searchForm!);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/search?q=typescript test');
      });
    });
  });

  describe('Performance', () => {
    it('renders efficiently without unnecessary re-renders', () => {
      const { rerender } = render(<NotFound />);
      
      // Component should render consistently
      expect(screen.getByText('404')).toBeInTheDocument();
      
      rerender(<NotFound />);
      
      expect(screen.getByText('404')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long search queries', async () => {
      render(<NotFound />);
      
      const longQuery = 'a'.repeat(1000);
      const searchInput = screen.getByPlaceholderText(/Search for pages, services, or help/);
      const searchForm = searchInput.closest('form');
      
      fireEvent.change(searchInput, { target: { value: longQuery } });
      fireEvent.submit(searchForm!);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(`/search?q=${longQuery}`);
      });
    });

    it('handles search queries with only whitespace', async () => {
      render(<NotFound />);
      
      const searchInput = screen.getByPlaceholderText(/Search for pages, services, or help/);
      const searchForm = searchInput.closest('form');
      
      fireEvent.change(searchInput, { target: { value: '   ' } });
      fireEvent.submit(searchForm!);
      
      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled();
      });
    });
  });

  describe('Dark Mode Compatibility', () => {
    it('renders correctly in dark mode', () => {
      // Add dark mode class to document
      document.documentElement.classList.add('dark');
      
      render(<NotFound />);
      
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      
      // Cleanup
      document.documentElement.classList.remove('dark');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<NotFound />);
      
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search for pages, services, or help/)).toBeInTheDocument();
    });
  });
});