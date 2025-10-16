/**
 * Error Codes Test Suite
 * Tests for standardized API error codes
 */

import {
  AUTH_ERROR_CODES,
  AUTHZ_ERROR_CODES,
  VALIDATION_ERROR_CODES,
  RESOURCE_ERROR_CODES,
  RATE_LIMIT_ERROR_CODES,
  SYSTEM_ERROR_CODES,
  BUSINESS_ERROR_CODES,
  API_ERROR_CODES,
  ERROR_CODE_MESSAGES,
  getErrorMessage,
  getErrorCategory,
  isAuthError,
  isAuthzError,
  isValidationError,
  isResourceError,
  isRateLimitError,
  isSystemError,
  isBusinessError,
  getErrorCodeDocumentation,
} from '@/lib/api/error-codes';

describe('Error Codes', () => {
  describe('AUTH_ERROR_CODES', () => {
    it('should have authentication error codes', () => {
      expect(AUTH_ERROR_CODES.TOKEN_MISSING).toBe('AUTH_001');
      expect(AUTH_ERROR_CODES.TOKEN_INVALID).toBe('AUTH_002');
      expect(AUTH_ERROR_CODES.TOKEN_EXPIRED).toBe('AUTH_003');
      expect(AUTH_ERROR_CODES.CREDENTIALS_INVALID).toBe('AUTH_005');
      expect(AUTH_ERROR_CODES.ACCOUNT_LOCKED).toBe('AUTH_011');
    });
  });

  describe('AUTHZ_ERROR_CODES', () => {
    it('should have authorization error codes', () => {
      expect(AUTHZ_ERROR_CODES.INSUFFICIENT_PERMISSIONS).toBe('AUTHZ_001');
      expect(AUTHZ_ERROR_CODES.RESOURCE_ACCESS_DENIED).toBe('AUTHZ_002');
      expect(AUTHZ_ERROR_CODES.ROLE_REQUIRED).toBe('AUTHZ_003');
      expect(AUTHZ_ERROR_CODES.SUBSCRIPTION_REQUIRED).toBe('AUTHZ_007');
    });
  });

  describe('VALIDATION_ERROR_CODES', () => {
    it('should have validation error codes', () => {
      expect(VALIDATION_ERROR_CODES.VALIDATION_FAILED).toBe('VAL_001');
      expect(VALIDATION_ERROR_CODES.REQUIRED_FIELD_MISSING).toBe('VAL_002');
      expect(VALIDATION_ERROR_CODES.INVALID_FIELD_FORMAT).toBe('VAL_003');
      expect(VALIDATION_ERROR_CODES.INVALID_EMAIL).toBe('VAL_007');
      expect(VALIDATION_ERROR_CODES.FILE_TOO_LARGE).toBe('VAL_018');
    });
  });

  describe('RESOURCE_ERROR_CODES', () => {
    it('should have resource error codes', () => {
      expect(RESOURCE_ERROR_CODES.RESOURCE_NOT_FOUND).toBe('RES_001');
      expect(RESOURCE_ERROR_CODES.RESOURCE_ALREADY_EXISTS).toBe('RES_002');
      expect(RESOURCE_ERROR_CODES.RESOURCE_CONFLICT).toBe('RES_003');
      expect(RESOURCE_ERROR_CODES.RESOURCE_LIMIT_EXCEEDED).toBe('RES_009');
    });
  });

  describe('RATE_LIMIT_ERROR_CODES', () => {
    it('should have rate limit error codes', () => {
      expect(RATE_LIMIT_ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe('RATE_001');
      expect(RATE_LIMIT_ERROR_CODES.QUOTA_EXCEEDED).toBe('RATE_002');
      expect(RATE_LIMIT_ERROR_CODES.API_CALL_LIMIT_EXCEEDED).toBe('RATE_005');
    });
  });

  describe('SYSTEM_ERROR_CODES', () => {
    it('should have system error codes', () => {
      expect(SYSTEM_ERROR_CODES.DATABASE_ERROR).toBe('SYS_001');
      expect(SYSTEM_ERROR_CODES.INTERNAL_SERVER_ERROR).toBe('SYS_003');
      expect(SYSTEM_ERROR_CODES.METHOD_NOT_ALLOWED).toBe('SYS_004');
      expect(SYSTEM_ERROR_CODES.SERVICE_UNAVAILABLE).toBe('SYS_005');
    });
  });

  describe('BUSINESS_ERROR_CODES', () => {
    it('should have business logic error codes', () => {
      expect(BUSINESS_ERROR_CODES.BUSINESS_RULE_VIOLATION).toBe('BIZ_001');
      expect(BUSINESS_ERROR_CODES.INVALID_OPERATION).toBe('BIZ_002');
      expect(BUSINESS_ERROR_CODES.OPERATION_NOT_ALLOWED).toBe('BIZ_003');
      expect(BUSINESS_ERROR_CODES.CAPACITY_EXCEEDED).toBe('BIZ_010');
    });
  });

  describe('API_ERROR_CODES', () => {
    it('should combine all error codes', () => {
      expect(API_ERROR_CODES.TOKEN_MISSING).toBe('AUTH_001');
      expect(API_ERROR_CODES.INSUFFICIENT_PERMISSIONS).toBe('AUTHZ_001');
      expect(API_ERROR_CODES.VALIDATION_FAILED).toBe('VAL_001');
      expect(API_ERROR_CODES.RESOURCE_NOT_FOUND).toBe('RES_001');
      expect(API_ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe('RATE_001');
      expect(API_ERROR_CODES.INTERNAL_SERVER_ERROR).toBe('SYS_003');
      expect(API_ERROR_CODES.BUSINESS_RULE_VIOLATION).toBe('BIZ_001');
    });
  });

  describe('ERROR_CODE_MESSAGES', () => {
    it('should have messages for all error codes', () => {
      expect(ERROR_CODE_MESSAGES['AUTH_001']).toBe('Authentication token is missing');
      expect(ERROR_CODE_MESSAGES['AUTHZ_001']).toBe('Insufficient permissions to perform this action');
      expect(ERROR_CODE_MESSAGES['VAL_001']).toBe('Validation failed');
      expect(ERROR_CODE_MESSAGES['RES_001']).toBe('Resource not found');
      expect(ERROR_CODE_MESSAGES['RATE_001']).toBe('Rate limit exceeded');
      expect(ERROR_CODE_MESSAGES['SYS_003']).toBe('Internal server error');
    });
  });

  describe('getErrorMessage', () => {
    it('should return correct message for known error codes', () => {
      expect(getErrorMessage('AUTH_001')).toBe('Authentication token is missing');
      expect(getErrorMessage('VAL_007')).toBe('Invalid email address');
      expect(getErrorMessage('RES_001')).toBe('Resource not found');
    });

    it('should return default message for unknown codes', () => {
      expect(getErrorMessage('UNKNOWN_999')).toBe('Unknown error occurred');
    });
  });

  describe('getErrorCategory', () => {
    it('should return correct category from error code', () => {
      expect(getErrorCategory('AUTH_001')).toBe('AUTH');
      expect(getErrorCategory('AUTHZ_001')).toBe('AUTHZ');
      expect(getErrorCategory('VAL_001')).toBe('VAL');
      expect(getErrorCategory('RES_001')).toBe('RES');
      expect(getErrorCategory('RATE_001')).toBe('RATE');
      expect(getErrorCategory('SYS_001')).toBe('SYS');
      expect(getErrorCategory('BIZ_001')).toBe('BIZ');
    });

    it('should return first part for invalid codes', () => {
      expect(getErrorCategory('INVALID')).toBe('INVALID');
      expect(getErrorCategory('')).toBe('UNKNOWN');
    });
  });

  describe('isAuthError', () => {
    it('should return true for AUTH codes', () => {
      expect(isAuthError('AUTH_001')).toBe(true);
      expect(isAuthError('AUTH_005')).toBe(true);
    });

    it('should return false for non-AUTH codes', () => {
      expect(isAuthError('AUTHZ_001')).toBe(false);
      expect(isAuthError('VAL_001')).toBe(false);
    });
  });

  describe('isAuthzError', () => {
    it('should return true for AUTHZ codes', () => {
      expect(isAuthzError('AUTHZ_001')).toBe(true);
      expect(isAuthzError('AUTHZ_002')).toBe(true);
    });

    it('should return false for non-AUTHZ codes', () => {
      expect(isAuthzError('AUTH_001')).toBe(false);
      expect(isAuthzError('VAL_001')).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should return true for VAL codes', () => {
      expect(isValidationError('VAL_001')).toBe(true);
      expect(isValidationError('VAL_007')).toBe(true);
    });

    it('should return false for non-VAL codes', () => {
      expect(isValidationError('AUTH_001')).toBe(false);
      expect(isValidationError('RES_001')).toBe(false);
    });
  });

  describe('isResourceError', () => {
    it('should return true for RES codes', () => {
      expect(isResourceError('RES_001')).toBe(true);
      expect(isResourceError('RES_003')).toBe(true);
    });

    it('should return false for non-RES codes', () => {
      expect(isResourceError('VAL_001')).toBe(false);
      expect(isResourceError('SYS_001')).toBe(false);
    });
  });

  describe('isRateLimitError', () => {
    it('should return true for RATE codes', () => {
      expect(isRateLimitError('RATE_001')).toBe(true);
      expect(isRateLimitError('RATE_002')).toBe(true);
    });

    it('should return false for non-RATE codes', () => {
      expect(isRateLimitError('VAL_001')).toBe(false);
      expect(isRateLimitError('SYS_001')).toBe(false);
    });
  });

  describe('isSystemError', () => {
    it('should return true for SYS codes', () => {
      expect(isSystemError('SYS_001')).toBe(true);
      expect(isSystemError('SYS_003')).toBe(true);
    });

    it('should return false for non-SYS codes', () => {
      expect(isSystemError('VAL_001')).toBe(false);
      expect(isSystemError('RES_001')).toBe(false);
    });
  });

  describe('isBusinessError', () => {
    it('should return true for BIZ codes', () => {
      expect(isBusinessError('BIZ_001')).toBe(true);
      expect(isBusinessError('BIZ_005')).toBe(true);
    });

    it('should return false for non-BIZ codes', () => {
      expect(isBusinessError('VAL_001')).toBe(false);
      expect(isBusinessError('SYS_001')).toBe(false);
    });
  });

  describe('getErrorCodeDocumentation', () => {
    it('should return documentation for known error codes', () => {
      const doc = getErrorCodeDocumentation('AUTH_001');
      
      expect(doc).toBeDefined();
      expect(doc?.code).toBe('AUTH_001');
      expect(doc?.message).toBe('Authentication token is missing');
      expect(doc?.category).toBe('AUTH');
      expect(doc?.description).toBeDefined();
      expect(doc?.resolution).toBeDefined();
    });

    it('should return default documentation for unknown error codes', () => {
      const doc = getErrorCodeDocumentation('UNKNOWN_999');
      expect(doc).toBeDefined();
      expect(doc?.code).toBe('UNKNOWN_999');
      expect(doc?.message).toBe('Unknown error occurred');
    });
  });

  describe('Error code format', () => {
    it('should follow CATEGORY_NUMBER format', () => {
      const allCodes = Object.values(API_ERROR_CODES);
      
      allCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z]+_\d{3}$/);
      });
    });

    it('should have unique error codes', () => {
      const allCodes = Object.values(API_ERROR_CODES);
      const uniqueCodes = new Set(allCodes);
      
      expect(uniqueCodes.size).toBe(allCodes.length);
    });
  });

  describe('Error message coverage', () => {
    it('should have messages for all error codes', () => {
      const allCodes = Object.values(API_ERROR_CODES);
      
      allCodes.forEach(code => {
        const message = getErrorMessage(code);
        expect(message).not.toBe('Unknown error occurred');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });
});
