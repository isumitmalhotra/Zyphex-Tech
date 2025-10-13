/**
 * @jest-environment jsdom
 */
import { ErrorTracker } from '@/lib/monitoring/error-tracker';
import * as Sentry from '@sentry/nextjs';

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

describe('ErrorTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('captureError', () => {
    it('should capture errors with context', () => {
      const error = new Error('Test error');
      const context = {
        user: { id: '123', email: 'test@example.com', role: 'USER' },
        tags: { type: 'test' },
        extra: { foo: 'bar' },
        level: 'error' as const,
      };

      ErrorTracker.captureError(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          user: context.user,
          tags: context.tags,
          extra: context.extra,
          level: 'error',
        })
      );
    });

    it('should use default error level when not specified', () => {
      const error = new Error('Test error');

      ErrorTracker.captureError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          level: 'error',
        })
      );
    });
  });

  describe('captureMessage', () => {
    it('should capture messages with context', () => {
      const message = 'Test message';
      const context = {
        tags: { type: 'info' },
        level: 'info' as const,
      };

      ErrorTracker.captureMessage(message, context);

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          tags: context.tags,
          level: 'info',
        })
      );
    });

    it('should use default info level when not specified', () => {
      const message = 'Test message';

      ErrorTracker.captureMessage(message);

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          level: 'info',
        })
      );
    });
  });

  describe('setUserContext', () => {
    it('should set user context correctly', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        role: 'USER',
      };

      ErrorTracker.setUserContext(user);

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
        username: user.role,
      });
    });

    it('should handle user without email', () => {
      const user = {
        id: '123',
        role: 'ADMIN',
      };

      ErrorTracker.setUserContext(user);

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: user.id,
        email: undefined,
        username: user.role,
      });
    });
  });

  describe('clearUserContext', () => {
    it('should clear user context', () => {
      ErrorTracker.clearUserContext();

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb with message and data', () => {
      const message = 'User clicked button';
      const data = { buttonId: 'submit-btn' };

      ErrorTracker.addBreadcrumb(message, data);

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message,
        data,
        timestamp: expect.any(Number),
      });
    });

    it('should add breadcrumb without data', () => {
      const message = 'Navigation occurred';

      ErrorTracker.addBreadcrumb(message);

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message,
        data: undefined,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('captureAPIError', () => {
    it('should track API errors with correct tags', () => {
      const endpoint = '/api/users';
      const method = 'GET';
      const statusCode = 500;
      const error = new Error('API Error');

      ErrorTracker.captureAPIError(endpoint, method, statusCode, error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: {
            type: 'api_error',
            endpoint,
            method,
            status_code: '500',
          },
          extra: {
            endpoint,
            method,
            statusCode,
          },
          level: 'error', // 500+ should be error
        })
      );
    });

    it('should mark 4xx errors as warnings', () => {
      const error = new Error('Not Found');

      ErrorTracker.captureAPIError('/api/test', 'GET', 404, error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          level: 'warning', // < 500 should be warning
        })
      );
    });

    it('should handle string errors', () => {
      const errorMessage = 'Something went wrong';

      ErrorTracker.captureAPIError('/api/test', 'POST', 500, errorMessage);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.anything()
      );
    });
  });

  describe('captureDatabaseError', () => {
    it('should track database errors with operation', () => {
      const operation = 'findUnique';
      const error = new Error('Database error');

      ErrorTracker.captureDatabaseError(operation, error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: {
            type: 'database_error',
            operation,
          },
          level: 'error',
        })
      );
    });
  });

  describe('captureAuthError', () => {
    it('should track authentication errors', () => {
      const error = new Error('Invalid credentials');

      ErrorTracker.captureAuthError('login', error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: {
            type: 'auth_error',
            auth_type: 'login',
          },
          level: 'warning',
        })
      );
    });

    it('should track different auth types', () => {
      const types: Array<'login' | 'register' | 'oauth' | 'session'> = [
        'login',
        'register',
        'oauth',
        'session',
      ];

      types.forEach((type) => {
        jest.clearAllMocks();
        ErrorTracker.captureAuthError(type, new Error('Auth error'));

        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            tags: expect.objectContaining({
              auth_type: type,
            }),
          })
        );
      });
    });
  });

  describe('captureFileUploadError', () => {
    it('should track file upload errors', () => {
      const fileName = 'test.pdf';
      const error = new Error('File too large');

      ErrorTracker.captureFileUploadError(fileName, error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: {
            type: 'file_upload_error',
          },
          extra: {
            fileName,
          },
          level: 'warning',
        })
      );
    });
  });

  describe('capturePaymentError', () => {
    it('should track payment errors', () => {
      const transactionId = 'txn_12345';
      const error = new Error('Payment failed');

      ErrorTracker.capturePaymentError(transactionId, error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: {
            type: 'payment_error',
          },
          extra: {
            transactionId,
          },
          level: 'error',
        })
      );
    });
  });

  describe('captureEmailError', () => {
    it('should track email errors with privacy', () => {
      const recipient = 'user@example.com';
      const templateType = 'welcome';
      const error = new Error('Email send failed');

      ErrorTracker.captureEmailError(recipient, templateType, error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: {
            type: 'email_error',
            template_type: templateType,
          },
          extra: {
            recipient: 'example.com', // Only domain for privacy
            templateType,
          },
          level: 'warning',
        })
      );
    });
  });

  describe('captureExternalServiceError', () => {
    it('should track external service errors', () => {
      const serviceName = 'stripe';
      const error = new Error('Service unavailable');

      ErrorTracker.captureExternalServiceError(serviceName, error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: {
            type: 'external_service_error',
            service: serviceName,
          },
          level: 'error',
        })
      );
    });
  });

  describe('captureValidationError', () => {
    it('should track validation errors', () => {
      const field = 'email';
      const error = 'Invalid email format';

      ErrorTracker.captureValidationError(field, error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: {
            type: 'validation_error',
          },
          extra: {
            field,
          },
          level: 'info',
        })
      );
    });

    it('should handle Error objects', () => {
      const field = 'password';
      const error = new Error('Password too weak');

      ErrorTracker.captureValidationError(field, error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.anything()
      );
    });
  });
});
