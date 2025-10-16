/**
 * API Validation Schemas
 * 
 * Comprehensive Zod schemas for API request validation.
 * These schemas provide type-safe validation with detailed error messages.
 * 
 * @module lib/api/validation/schemas
 */

import { z } from 'zod';

// ============================================================================
// Common Field Schemas
// ============================================================================

/**
 * UUID validation schema
 * Validates UUIDv4 format
 */
export const uuidSchema = z
  .string()
  .uuid({ message: 'Invalid UUID format' });

/**
 * Email validation schema
 * Validates email format with reasonable length limits
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase();

/**
 * Password validation schema
 * Enforces strong password requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Simple password schema (for updates, less strict)
 */
export const simplePasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters');

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .trim();

/**
 * Optional name schema
 */
export const optionalNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .trim()
  .optional();

/**
 * Description validation schema
 */
export const descriptionSchema = z
  .string()
  .max(500, 'Description must be less than 500 characters')
  .trim()
  .optional();

/**
 * Long text validation schema
 */
export const longTextSchema = z
  .string()
  .max(5000, 'Text must be less than 5000 characters')
  .trim()
  .optional();

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL must be less than 2048 characters')
  .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
    message: 'URL must start with http:// or https://',
  })
  .optional();

/**
 * Phone number validation schema (international format)
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

/**
 * Date string validation schema (ISO 8601)
 */
export const dateStringSchema = z
  .string()
  .datetime({ message: 'Invalid date format, use ISO 8601' })
  .optional();

// ============================================================================
// Enum Schemas
// ============================================================================

/**
 * User role enum schema
 */
export const userRoleSchema = z.enum(['ADMIN', 'MANAGER', 'MEMBER'], {
  errorMap: () => ({ message: 'Role must be ADMIN, MANAGER, or MEMBER' }),
});

/**
 * Project status enum schema
 */
export const projectStatusSchema = z.enum(
  ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
  {
    errorMap: () => ({
      message:
        'Status must be PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, or CANCELLED',
    }),
  }
);

/**
 * Priority enum schema
 */
export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
  errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, HIGH, or URGENT' }),
});

/**
 * Sort order enum schema
 */
export const sortOrderSchema = z.enum(['asc', 'desc'], {
  errorMap: () => ({ message: 'Sort order must be asc or desc' }),
});

// ============================================================================
// Pagination Schemas
// ============================================================================

/**
 * Pagination query parameters schema
 * Validates and coerces page/limit parameters with sensible defaults
 */
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(1000)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
  search: z.string().max(100, 'Search query too long').trim().optional(),
  sortBy: z.string().max(50, 'Sort field too long').trim().optional(),
  sortOrder: sortOrderSchema.default('asc'),
});

/**
 * Extended pagination with filters
 */
export const paginationWithFiltersSchema = paginationQuerySchema.extend({
  status: z.string().optional(),
  role: z.string().optional(),
  teamId: uuidSchema.optional(),
  projectId: uuidSchema.optional(),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
});

// ============================================================================
// User Schemas
// ============================================================================

/**
 * User creation schema
 * Validates all required fields for creating a new user
 */
export const userCreateSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  role: userRoleSchema.optional().default('MEMBER'),
  phone: phoneSchema,
  avatar: urlSchema,
});

/**
 * User update schema
 * All fields optional for partial updates
 */
export const userUpdateSchema = z.object({
  email: emailSchema.optional(),
  password: simplePasswordSchema.optional(),
  name: nameSchema.optional(),
  role: userRoleSchema.optional(),
  phone: phoneSchema,
  avatar: urlSchema,
});

/**
 * User profile update schema (for self-updates)
 * More restricted than admin updates
 */
export const userProfileUpdateSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema,
  avatar: urlSchema,
  currentPassword: simplePasswordSchema.optional(),
  newPassword: passwordSchema.optional(),
});

/**
 * User ID parameter schema
 */
export const userIdParamSchema = z.object({
  id: uuidSchema,
});

/**
 * User list query schema
 */
export const userListQuerySchema = paginationQuerySchema.extend({
  role: userRoleSchema.optional(),
  teamId: uuidSchema.optional(),
});

// ============================================================================
// Team Schemas
// ============================================================================

/**
 * Team creation schema
 */
export const teamCreateSchema = z.object({
  name: z
    .string()
    .min(3, 'Team name must be at least 3 characters')
    .max(100, 'Team name must be less than 100 characters')
    .trim(),
  description: descriptionSchema,
});

/**
 * Team update schema
 */
export const teamUpdateSchema = teamCreateSchema.partial();

/**
 * Team ID parameter schema
 */
export const teamIdParamSchema = z.object({
  id: uuidSchema,
});

/**
 * Team member add schema
 */
export const teamMemberAddSchema = z.object({
  userId: uuidSchema,
  role: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER'),
});

/**
 * Team list query schema
 */
export const teamListQuerySchema = paginationQuerySchema;

// ============================================================================
// Project Schemas
// ============================================================================

/**
 * Project creation schema
 */
export const projectCreateSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be less than 100 characters')
    .trim(),
  description: descriptionSchema,
  status: projectStatusSchema.optional().default('PLANNING'),
  priority: prioritySchema.optional().default('MEDIUM'),
  teamId: uuidSchema.optional(),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  budget: z.number().positive('Budget must be positive').optional(),
});

/**
 * Project update schema
 */
export const projectUpdateSchema = projectCreateSchema.partial();

/**
 * Project ID parameter schema
 */
export const projectIdParamSchema = z.object({
  id: uuidSchema,
});

/**
 * Project list query schema
 */
export const projectListQuerySchema = paginationQuerySchema.extend({
  status: projectStatusSchema.optional(),
  priority: prioritySchema.optional(),
  teamId: uuidSchema.optional(),
});

// ============================================================================
// Authentication Schemas
// ============================================================================

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Register schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

/**
 * Email verification schema
 */
export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// ============================================================================
// Message/Notification Schemas
// ============================================================================

/**
 * Message creation schema
 */
export const messageCreateSchema = z.object({
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(5000, 'Message must be less than 5000 characters')
    .trim(),
  recipientId: uuidSchema.optional(),
  teamId: uuidSchema.optional(),
  parentId: uuidSchema.optional(),
  attachments: z.array(urlSchema).max(10, 'Maximum 10 attachments').optional(),
});

/**
 * Notification preference schema
 */
export const notificationPreferenceSchema = z.object({
  email: z.boolean().default(true),
  push: z.boolean().default(true),
  sms: z.boolean().default(false),
  inApp: z.boolean().default(true),
});

// ============================================================================
// File Upload Schemas
// ============================================================================

/**
 * File upload metadata schema
 */
export const fileUploadSchema = z.object({
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .trim(),
  mimeType: z.string().min(1, 'MIME type is required'),
  size: z.number().int().positive().max(100 * 1024 * 1024, 'File too large (max 100MB)'),
  description: descriptionSchema,
});

// ============================================================================
// Search Schemas
// ============================================================================

/**
 * Global search schema
 */
export const globalSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long')
    .trim(),
  type: z
    .enum(['all', 'users', 'teams', 'projects', 'messages'])
    .optional()
    .default('all'),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(50)),
});

// ============================================================================
// Webhook Schemas
// ============================================================================

/**
 * Webhook creation schema
 */
export const webhookCreateSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  events: z
    .array(z.string())
    .min(1, 'At least one event must be selected')
    .max(20, 'Maximum 20 events'),
  secret: z.string().min(16, 'Secret must be at least 16 characters').optional(),
  active: z.boolean().default(true),
});

/**
 * Webhook update schema
 */
export const webhookUpdateSchema = webhookCreateSchema.partial();

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;

export type TeamCreateInput = z.infer<typeof teamCreateSchema>;
export type TeamUpdateInput = z.infer<typeof teamUpdateSchema>;
export type TeamMemberAddInput = z.infer<typeof teamMemberAddSchema>;

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PaginationWithFilters = z.infer<typeof paginationWithFiltersSchema>;

export type GlobalSearchQuery = z.infer<typeof globalSearchSchema>;
export type FileUploadMetadata = z.infer<typeof fileUploadSchema>;
export type WebhookCreateInput = z.infer<typeof webhookCreateSchema>;
export type WebhookUpdateInput = z.infer<typeof webhookUpdateSchema>;
