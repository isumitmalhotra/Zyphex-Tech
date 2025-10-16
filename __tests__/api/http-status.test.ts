/**
 * HTTP Status Test Suite
 * Tests for HTTP status code utilities
 */

import {
  HTTP_STATUS,
  HTTP_STATUS_MESSAGES,
  STATUS_CATEGORIES,
  getStatusMessage,
  getStatusCategory,
  isSuccessStatus,
  isClientError,
  isServerError,
  isErrorStatus,
  isRedirectStatus,
  getStatusCodeUsage,
} from '@/lib/api/http-status';

describe('HTTP Status', () => {
  describe('HTTP_STATUS constants', () => {
    it('should have correct 2xx status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.ACCEPTED).toBe(202);
      expect(HTTP_STATUS.NO_CONTENT).toBe(204);
    });

    it('should have correct 3xx status codes', () => {
      expect(HTTP_STATUS.MOVED_PERMANENTLY).toBe(301);
      expect(HTTP_STATUS.FOUND).toBe(302);
      expect(HTTP_STATUS.NOT_MODIFIED).toBe(304);
      expect(HTTP_STATUS.TEMPORARY_REDIRECT).toBe(307);
      expect(HTTP_STATUS.PERMANENT_REDIRECT).toBe(308);
    });

    it('should have correct 4xx status codes', () => {
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.METHOD_NOT_ALLOWED).toBe(405);
      expect(HTTP_STATUS.CONFLICT).toBe(409);
      expect(HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(422);
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
    });

    it('should have correct 5xx status codes', () => {
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
      expect(HTTP_STATUS.NOT_IMPLEMENTED).toBe(501);
      expect(HTTP_STATUS.BAD_GATEWAY).toBe(502);
      expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503);
      expect(HTTP_STATUS.GATEWAY_TIMEOUT).toBe(504);
    });
  });

  describe('HTTP_STATUS_MESSAGES', () => {
    it('should have messages for common status codes', () => {
      expect(HTTP_STATUS_MESSAGES[200]).toBe('OK');
      expect(HTTP_STATUS_MESSAGES[201]).toBe('Created');
      expect(HTTP_STATUS_MESSAGES[400]).toBe('Bad Request');
      expect(HTTP_STATUS_MESSAGES[401]).toBe('Unauthorized');
      expect(HTTP_STATUS_MESSAGES[404]).toBe('Not Found');
      expect(HTTP_STATUS_MESSAGES[500]).toBe('Internal Server Error');
    });
  });

  describe('STATUS_CATEGORIES', () => {
    it('should have correct category labels', () => {
      expect(STATUS_CATEGORIES.INFORMATIONAL).toBe('1xx');
      expect(STATUS_CATEGORIES.SUCCESS).toBe('2xx');
      expect(STATUS_CATEGORIES.REDIRECTION).toBe('3xx');
      expect(STATUS_CATEGORIES.CLIENT_ERROR).toBe('4xx');
      expect(STATUS_CATEGORIES.SERVER_ERROR).toBe('5xx');
    });
  });

  describe('getStatusMessage', () => {
    it('should return correct message for known status codes', () => {
      expect(getStatusMessage(200)).toBe('OK');
      expect(getStatusMessage(404)).toBe('Not Found');
      expect(getStatusMessage(500)).toBe('Internal Server Error');
    });

    it('should return Unknown Status for unknown codes', () => {
      expect(getStatusMessage(999)).toBe('Unknown Status');
      expect(getStatusMessage(123)).toBe('Unknown Status');
    });
  });

  describe('getStatusCategory', () => {
    it('should return correct category for status codes', () => {
      expect(getStatusCategory(150)).toBe('1xx');
      expect(getStatusCategory(200)).toBe('2xx');
      expect(getStatusCategory(301)).toBe('3xx');
      expect(getStatusCategory(404)).toBe('4xx');
      expect(getStatusCategory(500)).toBe('5xx');
    });

    it('should return Unknown for invalid codes', () => {
      expect(getStatusCategory(999)).toBe('Unknown');
      expect(getStatusCategory(0)).toBe('Unknown');
    });
  });

  describe('isSuccessStatus', () => {
    it('should return true for 2xx codes', () => {
      expect(isSuccessStatus(200)).toBe(true);
      expect(isSuccessStatus(201)).toBe(true);
      expect(isSuccessStatus(204)).toBe(true);
      expect(isSuccessStatus(299)).toBe(true);
    });

    it('should return false for non-2xx codes', () => {
      expect(isSuccessStatus(199)).toBe(false);
      expect(isSuccessStatus(300)).toBe(false);
      expect(isSuccessStatus(400)).toBe(false);
      expect(isSuccessStatus(500)).toBe(false);
    });
  });

  describe('isClientError', () => {
    it('should return true for 4xx codes', () => {
      expect(isClientError(400)).toBe(true);
      expect(isClientError(404)).toBe(true);
      expect(isClientError(422)).toBe(true);
      expect(isClientError(499)).toBe(true);
    });

    it('should return false for non-4xx codes', () => {
      expect(isClientError(399)).toBe(false);
      expect(isClientError(200)).toBe(false);
      expect(isClientError(500)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true for 5xx codes', () => {
      expect(isServerError(500)).toBe(true);
      expect(isServerError(502)).toBe(true);
      expect(isServerError(503)).toBe(true);
      expect(isServerError(599)).toBe(true);
    });

    it('should return false for non-5xx codes', () => {
      expect(isServerError(499)).toBe(false);
      expect(isServerError(200)).toBe(false);
      expect(isServerError(400)).toBe(false);
    });
  });

  describe('isErrorStatus', () => {
    it('should return true for 4xx and 5xx codes', () => {
      expect(isErrorStatus(400)).toBe(true);
      expect(isErrorStatus(404)).toBe(true);
      expect(isErrorStatus(500)).toBe(true);
      expect(isErrorStatus(502)).toBe(true);
    });

    it('should return false for non-error codes', () => {
      expect(isErrorStatus(200)).toBe(false);
      expect(isErrorStatus(201)).toBe(false);
      expect(isErrorStatus(301)).toBe(false);
    });
  });

  describe('isRedirectStatus', () => {
    it('should return true for 3xx codes', () => {
      expect(isRedirectStatus(301)).toBe(true);
      expect(isRedirectStatus(302)).toBe(true);
      expect(isRedirectStatus(307)).toBe(true);
      expect(isRedirectStatus(399)).toBe(true);
    });

    it('should return false for non-3xx codes', () => {
      expect(isRedirectStatus(299)).toBe(false);
      expect(isRedirectStatus(200)).toBe(false);
      expect(isRedirectStatus(400)).toBe(false);
    });
  });

  describe('getStatusCodeUsage', () => {
    it('should return usage documentation for known status codes', () => {
      const usage200 = getStatusCodeUsage(200);
      expect(usage200).toBeDefined();
      expect(usage200?.usage).toBeDefined();
      expect(usage200?.example).toBeDefined();

      const usage404 = getStatusCodeUsage(404);
      expect(usage404).toBeDefined();
      expect(usage404?.usage).toContain('not found');
    });

    it('should return null for unknown status codes', () => {
      expect(getStatusCodeUsage(999)).toBeNull();
    });
  });
});
