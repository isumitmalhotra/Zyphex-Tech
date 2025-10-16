/**
 * API Validation Module
 * 
 * Public exports for request validation using Zod schemas.
 * 
 * @module lib/api/validation
 */

// Middleware
export {
  withValidation,
  withMultiValidation,
  withQueryValidation,
  withParamsValidation,
  withBodyValidation,
  validateData,
  isValid,
  formatZodErrors,
  type ValidationTarget,
  type ValidationOptions,
  type ValidatedRequest,
  type ValidatedRouteHandler,
} from './middleware';

// Schemas
export {
  // Common fields
  uuidSchema,
  emailSchema,
  passwordSchema,
  simplePasswordSchema,
  nameSchema,
  optionalNameSchema,
  descriptionSchema,
  longTextSchema,
  urlSchema,
  phoneSchema,
  dateStringSchema,
  
  // Enums
  userRoleSchema,
  projectStatusSchema,
  prioritySchema,
  sortOrderSchema,
  
  // Pagination
  paginationQuerySchema,
  paginationWithFiltersSchema,
  
  // Users
  userCreateSchema,
  userUpdateSchema,
  userProfileUpdateSchema,
  userIdParamSchema,
  userListQuerySchema,
  
  // Teams
  teamCreateSchema,
  teamUpdateSchema,
  teamIdParamSchema,
  teamMemberAddSchema,
  teamListQuerySchema,
  
  // Projects
  projectCreateSchema,
  projectUpdateSchema,
  projectIdParamSchema,
  projectListQuerySchema,
  
  // Authentication
  loginSchema,
  registerSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  emailVerificationSchema,
  changePasswordSchema,
  
  // Messages/Notifications
  messageCreateSchema,
  notificationPreferenceSchema,
  
  // Files
  fileUploadSchema,
  
  // Search
  globalSearchSchema,
  
  // Webhooks
  webhookCreateSchema,
  webhookUpdateSchema,
  
  // Type exports
  type UserCreateInput,
  type UserUpdateInput,
  type UserProfileUpdateInput,
  type UserListQuery,
  type TeamCreateInput,
  type TeamUpdateInput,
  type TeamMemberAddInput,
  type ProjectCreateInput,
  type ProjectUpdateInput,
  type ProjectListQuery,
  type LoginInput,
  type RegisterInput,
  type PasswordResetRequestInput,
  type PasswordResetInput,
  type MessageCreateInput,
  type NotificationPreference,
  type PaginationQuery,
  type PaginationWithFilters,
  type GlobalSearchQuery,
  type FileUploadMetadata,
  type WebhookCreateInput,
  type WebhookUpdateInput,
} from './schemas';
