/**
 * Tests for API Validation Schemas
 */

import {
  // Common fields
  uuidSchema,
  emailSchema,
  passwordSchema,
  simplePasswordSchema,
  nameSchema,
  phoneSchema,
  urlSchema,
  
  // Enums
  userRoleSchema,
  projectStatusSchema,
  prioritySchema,
  sortOrderSchema,
  
  // Pagination
  paginationQuerySchema,
  
  // Users
  userCreateSchema,
  userUpdateSchema,
  userProfileUpdateSchema,
  
  // Teams
  teamCreateSchema,
  teamUpdateSchema,
  
  // Projects
  projectCreateSchema,
  
  // Auth
  loginSchema,
  registerSchema,
  passwordResetSchema,
} from '../../../lib/api/validation/schemas';

describe('API Validation Schemas', () => {
  // ============================================================================
  // Common Field Schemas
  // ============================================================================

  describe('uuidSchema', () => {
    it('should validate valid UUIDs', () => {
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      ];

      validUuids.forEach((uuid) => {
        expect(() => uuidSchema.parse(uuid)).not.toThrow();
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUuids = ['not-a-uuid', '123', '', 'abc-def-ghi'];

      invalidUuids.forEach((uuid) => {
        expect(() => uuidSchema.parse(uuid)).toThrow();
      });
    });
  });

  describe('emailSchema', () => {
    it('should validate valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com',
      ];

      validEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('should normalize email to lowercase', () => {
      const result = emailSchema.parse('TEST@EXAMPLE.COM');
      expect(result).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const result = emailSchema.parse('  test@example.com  ');
      expect(result).toBe('test@example.com');
    });

    it('should reject invalid emails', () => {
      const invalidEmails = ['invalid', 'missing@', '@domain.com', '', 'no-at-sign.com'];

      invalidEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });
  });

  describe('passwordSchema', () => {
    it('should validate strong passwords', () => {
      const validPasswords = ['Test1234', 'SecurePass123', 'MyP@ssw0rd'];

      validPasswords.forEach((password) => {
        expect(() => passwordSchema.parse(password)).not.toThrow();
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'short',
        'nouppercase1',
        'NOLOWERCASE1',
        'NoNumbers',
        'a'.repeat(101), // Too long
      ];

      weakPasswords.forEach((password) => {
        expect(() => passwordSchema.parse(password)).toThrow();
      });
    });
  });

  describe('simplePasswordSchema', () => {
    it('should validate passwords with minimum length', () => {
      expect(() => simplePasswordSchema.parse('12345678')).not.toThrow();
      expect(() => simplePasswordSchema.parse('testpass')).not.toThrow();
    });

    it('should reject short passwords', () => {
      expect(() => simplePasswordSchema.parse('short')).toThrow();
      expect(() => simplePasswordSchema.parse('1234567')).toThrow();
    });
  });

  describe('nameSchema', () => {
    it('should validate names', () => {
      expect(() => nameSchema.parse('John Doe')).not.toThrow();
      expect(() => nameSchema.parse('李明')).not.toThrow(); // Unicode
    });

    it('should trim whitespace', () => {
      const result = nameSchema.parse('  John Doe  ');
      expect(result).toBe('John Doe');
    });

    it('should reject invalid names', () => {
      expect(() => nameSchema.parse('A')).toThrow(); // Too short
      expect(() => nameSchema.parse('a'.repeat(101))).toThrow(); // Too long
    });
  });

  describe('phoneSchema', () => {
    it('should validate international phone numbers', () => {
      const validPhones = ['+14155552671', '+442071234567', '+919876543210'];

      validPhones.forEach((phone) => {
        expect(() => phoneSchema.parse(phone)).not.toThrow();
      });
    });

    it('should accept undefined (optional)', () => {
      expect(phoneSchema.parse(undefined)).toBeUndefined();
    });
  });

  describe('urlSchema', () => {
    it('should validate URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://sub.domain.com/path?query=value',
      ];

      validUrls.forEach((url) => {
        expect(() => urlSchema.parse(url)).not.toThrow();
      });
    });

    it('should reject invalid URLs', () => {
      expect(() => urlSchema.parse('not-a-url')).toThrow();
      expect(() => urlSchema.parse('ftp://example.com')).toThrow(); // Invalid protocol (only http/https allowed)
      expect(() => urlSchema.parse('javascript:alert(1)')).toThrow(); // Security risk
    });
  });

  // ============================================================================
  // Enum Schemas
  // ============================================================================

  describe('userRoleSchema', () => {
    it('should validate valid roles', () => {
      const validRoles = ['ADMIN', 'MANAGER', 'MEMBER'];

      validRoles.forEach((role) => {
        expect(() => userRoleSchema.parse(role)).not.toThrow();
      });
    });

    it('should reject invalid roles', () => {
      expect(() => userRoleSchema.parse('INVALID')).toThrow();
      expect(() => userRoleSchema.parse('user')).toThrow();
    });
  });

  describe('projectStatusSchema', () => {
    it('should validate valid statuses', () => {
      const validStatuses = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

      validStatuses.forEach((status) => {
        expect(() => projectStatusSchema.parse(status)).not.toThrow();
      });
    });

    it('should reject invalid statuses', () => {
      expect(() => projectStatusSchema.parse('INVALID')).toThrow();
    });
  });

  describe('prioritySchema', () => {
    it('should validate valid priorities', () => {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

      validPriorities.forEach((priority) => {
        expect(() => prioritySchema.parse(priority)).not.toThrow();
      });
    });
  });

  describe('sortOrderSchema', () => {
    it('should validate sort orders', () => {
      expect(() => sortOrderSchema.parse('asc')).not.toThrow();
      expect(() => sortOrderSchema.parse('desc')).not.toThrow();
    });

    it('should reject invalid sort orders', () => {
      expect(() => sortOrderSchema.parse('ascending')).toThrow();
    });
  });

  // ============================================================================
  // Pagination Schemas
  // ============================================================================

  describe('paginationQuerySchema', () => {
    it('should parse valid pagination params', () => {
      const result = paginationQuerySchema.parse({
        page: '1',
        limit: '20',
        search: 'test',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result).toEqual({
        page: 1,
        limit: 20,
        search: 'test',
        sortBy: 'name',
        sortOrder: 'asc',
      });
    });

    it('should apply defaults', () => {
      const result = paginationQuerySchema.parse({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortOrder).toBe('asc');
    });

    it('should coerce string numbers', () => {
      const result = paginationQuerySchema.parse({
        page: '5',
        limit: '50',
      });

      expect(result.page).toBe(5);
      expect(result.limit).toBe(50);
    });

    it('should enforce limits', () => {
      expect(() =>
        paginationQuerySchema.parse({ page: '0' })
      ).toThrow(); // Min 1

      expect(() =>
        paginationQuerySchema.parse({ limit: '200' })
      ).toThrow(); // Max 100
    });
  });

  // ============================================================================
  // User Schemas
  // ============================================================================

  describe('userCreateSchema', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'SecurePass123',
      name: 'John Doe',
    };

    it('should validate valid user creation data', () => {
      expect(() => userCreateSchema.parse(validUser)).not.toThrow();
    });

    it('should apply default role', () => {
      const result = userCreateSchema.parse(validUser);
      expect(result.role).toBe('MEMBER');
    });

    it('should accept custom role', () => {
      const result = userCreateSchema.parse({
        ...validUser,
        role: 'ADMIN',
      });
      expect(result.role).toBe('ADMIN');
    });

    it('should reject invalid data', () => {
      // Missing required fields
      expect(() =>
        userCreateSchema.parse({ email: 'test@example.com' })
      ).toThrow();

      // Weak password
      expect(() =>
        userCreateSchema.parse({
          ...validUser,
          password: 'weak',
        })
      ).toThrow();

      // Invalid email
      expect(() =>
        userCreateSchema.parse({
          ...validUser,
          email: 'invalid-email',
        })
      ).toThrow();
    });
  });

  describe('userUpdateSchema', () => {
    it('should allow partial updates', () => {
      expect(() =>
        userUpdateSchema.parse({ name: 'New Name' })
      ).not.toThrow();

      expect(() =>
        userUpdateSchema.parse({ email: 'new@example.com' })
      ).not.toThrow();

      expect(() => userUpdateSchema.parse({})).not.toThrow();
    });

    it('should validate updated fields', () => {
      expect(() =>
        userUpdateSchema.parse({ email: 'invalid' })
      ).toThrow();

      expect(() =>
        userUpdateSchema.parse({ name: 'A' })
      ).toThrow(); // Too short
    });
  });

  describe('userProfileUpdateSchema', () => {
    it('should allow self-updates', () => {
      expect(() =>
        userProfileUpdateSchema.parse({
          name: 'New Name',
          phone: '+14155552671',
        })
      ).not.toThrow();
    });

    it('should validate password changes', () => {
      expect(() =>
        userProfileUpdateSchema.parse({
          currentPassword: 'oldpass123',
          newPassword: 'NewSecure123',
        })
      ).not.toThrow();
    });

    it('should not allow role changes', () => {
      // userProfileUpdateSchema should not have role field
      const result = userProfileUpdateSchema.parse({ name: 'Test' });
      expect('role' in result).toBe(false);
    });
  });

  // ============================================================================
  // Team Schemas
  // ============================================================================

  describe('teamCreateSchema', () => {
    const validTeam = {
      name: 'Engineering Team',
      description: 'Software development team',
    };

    it('should validate valid team data', () => {
      expect(() => teamCreateSchema.parse(validTeam)).not.toThrow();
    });

    it('should allow optional description', () => {
      expect(() =>
        teamCreateSchema.parse({ name: 'Engineering Team' })
      ).not.toThrow();
    });

    it('should enforce name length', () => {
      expect(() => teamCreateSchema.parse({ name: 'AB' })).toThrow(); // Too short

      expect(() =>
        teamCreateSchema.parse({ name: 'a'.repeat(101) })
      ).toThrow(); // Too long
    });

    it('should trim name', () => {
      const result = teamCreateSchema.parse({
        name: '  Engineering Team  ',
      });
      expect(result.name).toBe('Engineering Team');
    });
  });

  describe('teamUpdateSchema', () => {
    it('should allow partial updates', () => {
      expect(() =>
        teamUpdateSchema.parse({ name: 'New Team Name' })
      ).not.toThrow();

      expect(() =>
        teamUpdateSchema.parse({ description: 'New description' })
      ).not.toThrow();

      expect(() => teamUpdateSchema.parse({})).not.toThrow();
    });
  });

  // ============================================================================
  // Project Schemas
  // ============================================================================

  describe('projectCreateSchema', () => {
    const validProject = {
      name: 'Website Redesign',
      description: 'Complete redesign of company website',
      status: 'PLANNING' as const,
      priority: 'HIGH' as const,
    };

    it('should validate valid project data', () => {
      expect(() => projectCreateSchema.parse(validProject)).not.toThrow();
    });

    it('should apply defaults', () => {
      const result = projectCreateSchema.parse({
        name: 'Website Redesign',
      });

      expect(result.status).toBe('PLANNING');
      expect(result.priority).toBe('MEDIUM');
    });

    it('should validate budget', () => {
      expect(() =>
        projectCreateSchema.parse({
          ...validProject,
          budget: 50000,
        })
      ).not.toThrow();

      expect(() =>
        projectCreateSchema.parse({
          ...validProject,
          budget: -1000,
        })
      ).toThrow(); // Negative budget
    });

    it('should enforce name length', () => {
      expect(() =>
        projectCreateSchema.parse({ name: 'AB' })
      ).toThrow();
    });
  });

  // ============================================================================
  // Authentication Schemas
  // ============================================================================

  describe('loginSchema', () => {
    it('should validate login credentials', () => {
      expect(() =>
        loginSchema.parse({
          email: 'test@example.com',
          password: 'anypassword',
        })
      ).not.toThrow();
    });

    it('should require both fields', () => {
      expect(() =>
        loginSchema.parse({ email: 'test@example.com' })
      ).toThrow();

      expect(() =>
        loginSchema.parse({ password: 'password' })
      ).toThrow();
    });

    it('should validate email format', () => {
      expect(() =>
        loginSchema.parse({
          email: 'invalid',
          password: 'password',
        })
      ).toThrow();
    });
  });

  describe('registerSchema', () => {
    const validRegistration = {
      email: 'newuser@example.com',
      password: 'SecurePass123',
      name: 'New User',
    };

    it('should validate registration data', () => {
      expect(() => registerSchema.parse(validRegistration)).not.toThrow();
    });

    it('should enforce strong password', () => {
      expect(() =>
        registerSchema.parse({
          ...validRegistration,
          password: 'weak',
        })
      ).toThrow();
    });

    it('should require all fields', () => {
      expect(() =>
        registerSchema.parse({
          email: 'test@example.com',
          password: 'SecurePass123',
        })
      ).toThrow(); // Missing name
    });
  });

  describe('passwordResetSchema', () => {
    it('should validate password reset data', () => {
      expect(() =>
        passwordResetSchema.parse({
          token: 'reset-token-123',
          password: 'NewSecure123',
        })
      ).not.toThrow();
    });

    it('should require token and password', () => {
      expect(() =>
        passwordResetSchema.parse({ password: 'NewSecure123' })
      ).toThrow();

      expect(() =>
        passwordResetSchema.parse({ token: 'reset-token-123' })
      ).toThrow();
    });

    it('should enforce strong password', () => {
      expect(() =>
        passwordResetSchema.parse({
          token: 'reset-token-123',
          password: 'weak',
        })
      ).toThrow();
    });
  });
});
