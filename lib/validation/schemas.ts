import { z } from 'zod'
import { passwordSchema } from '@/lib/auth/password'

// Common validation patterns
const emailSchema = z.string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .transform(email => email.toLowerCase().trim())

const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform(name => name.trim())

const phoneSchema = z.string()
  .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
  .optional()

const urlSchema = z.string()
  .url('Invalid URL format')
  .max(2048, 'URL must not exceed 2048 characters')
  .optional()

// User Registration Schema
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  company: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name must not exceed 200 characters')
    .optional(),
  phone: phoneSchema,
  role: z.enum(['USER', 'CLIENT']).default('USER'),
  timezone: z.string()
    .regex(/^[A-Za-z_\/]+$/, 'Invalid timezone format')
    .optional(),
  agreeToTerms: z.boolean()
    .refine(val => val === true, 'You must agree to the terms and conditions')
}).refine(data => {
  // Additional business logic validation
  if (data.role === 'CLIENT' && !data.company) {
    return false
  }
  return true
}, {
  message: 'Company name is required for client accounts',
  path: ['company']
})

// User Login Schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false)
})

// Password Reset Schemas
export const passwordResetRequestSchema = z.object({
  email: emailSchema
})

export const passwordResetSchema = z.object({
  token: z.string().min(32, 'Invalid reset token'),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

// User Profile Update Schema
export const userProfileSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema,
  company: z.string().max(200, 'Company name must not exceed 200 characters').optional(),
  timezone: z.string().regex(/^[A-Za-z_\/]+$/, 'Invalid timezone format').optional(),
  skills: z.array(z.string().max(50, 'Skill name too long')).max(20, 'Too many skills').optional(),
  hourlyRate: z.number().positive('Hourly rate must be positive').max(10000, 'Hourly rate too high').optional(),
  availability: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'UNAVAILABLE']).optional()
})

// Project Schema
export const projectSchema = z.object({
  name: z.string()
    .min(3, 'Project name must be at least 3 characters')
    .max(200, 'Project name must not exceed 200 characters')
    .regex(/^[a-zA-Z0-9\s\-_\.]+$/, 'Project name contains invalid characters'),
  description: z.string()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),
  clientId: z.string().uuid('Invalid client ID'),
  budget: z.number()
    .positive('Budget must be positive')
    .max(10000000, 'Budget too high')
    .finite('Budget must be a valid number'),
  hourlyRate: z.number()
    .positive('Hourly rate must be positive')
    .max(1000, 'Hourly rate too high')
    .finite('Hourly rate must be a valid number'),
  startDate: z.string()
    .datetime('Invalid start date format')
    .refine(date => new Date(date) >= new Date(), 'Start date cannot be in the past'),
  endDate: z.string()
    .datetime('Invalid end date format')
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  methodology: z.enum(['AGILE', 'WATERFALL', 'SCRUM', 'KANBAN']).default('AGILE'),
  estimatedHours: z.number()
    .positive('Estimated hours must be positive')
    .max(100000, 'Estimated hours too high')
    .optional(),
  tags: z.array(z.string().max(30, 'Tag too long')).max(10, 'Too many tags').optional()
}).refine(data => {
  if (data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate']
})

// Task Schema
export const taskSchema = z.object({
  title: z.string()
    .min(3, 'Task title must be at least 3 characters')
    .max(200, 'Task title must not exceed 200 characters'),
  description: z.string()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),
  projectId: z.string().uuid('Invalid project ID'),
  assigneeId: z.string().uuid('Invalid assignee ID').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']).default('TODO'),
  dueDate: z.string()
    .datetime('Invalid due date format')
    .optional(),
  estimatedHours: z.number()
    .positive('Estimated hours must be positive')
    .max(1000, 'Estimated hours too high')
    .optional(),
  tags: z.array(z.string().max(30, 'Tag too long')).max(5, 'Too many tags').optional()
}).refine(data => {
  if (data.dueDate) {
    return new Date(data.dueDate) >= new Date()
  }
  return true
}, {
  message: 'Due date cannot be in the past',
  path: ['dueDate']
})

// Client Schema
export const clientSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  company: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name must not exceed 200 characters'),
  address: z.string()
    .max(500, 'Address must not exceed 500 characters')
    .optional(),
  website: urlSchema,
  timezone: z.string()
    .regex(/^[A-Za-z_\/]+$/, 'Invalid timezone format')
    .optional(),
  industry: z.string()
    .max(100, 'Industry must not exceed 100 characters')
    .optional()
})

// Invoice Schema
export const invoiceSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  clientId: z.string().uuid('Invalid client ID'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(10000000, 'Amount too high')
    .finite('Amount must be a valid number'),
  dueDate: z.string()
    .datetime('Invalid due date format')
    .refine(date => new Date(date) >= new Date(), 'Due date cannot be in the past'),
  taxRate: z.number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .default(0),
  currency: z.string()
    .length(3, 'Currency must be 3 characters (ISO 4217)')
    .default('USD')
})

// Time Entry Schema
export const timeEntrySchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  taskId: z.string().uuid('Invalid task ID').optional(),
  description: z.string()
    .min(5, 'Description must be at least 5 characters')
    .max(500, 'Description must not exceed 500 characters'),
  hours: z.number()
    .positive('Hours must be positive')
    .max(24, 'Hours cannot exceed 24 in a single entry')
    .finite('Hours must be a valid number'),
  date: z.string()
    .datetime('Invalid date format')
    .refine(date => new Date(date) <= new Date(), 'Date cannot be in the future'),
  billable: z.boolean().default(true)
})

// Message Schema
export const messageSchema = z.object({
  receiverId: z.string().uuid('Invalid receiver ID'),
  projectId: z.string().uuid('Invalid project ID').optional(),
  subject: z.string()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must not exceed 200 characters'),
  content: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must not exceed 5000 characters'),
  type: z.enum(['GENERAL', 'PROJECT_UPDATE', 'TASK_ASSIGNMENT', 'URGENT']).default('GENERAL'),
  attachments: z.array(z.string().url('Invalid attachment URL')).max(5, 'Too many attachments').optional()
})

// File Upload Schema
export const fileUploadSchema = z.object({
  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name too long')
    .regex(/^[^<>:"/\\|?*]+$/, 'Invalid file name characters'),
  fileSize: z.number()
    .positive('File size must be positive')
    .max(100 * 1024 * 1024, 'File size cannot exceed 100MB'), // 100MB limit
  mimeType: z.string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*$/, 'Invalid MIME type'),
  projectId: z.string().uuid('Invalid project ID').optional()
})

// Search Schema
export const searchSchema = z.object({
  query: z.string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query too long')
    .regex(/^[a-zA-Z0-9\s\-_\.]+$/, 'Search query contains invalid characters'),
  type: z.enum(['projects', 'tasks', 'clients', 'users', 'all']).default('all'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
})

// Pagination Schema
export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.string().max(50, 'Sort field name too long').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// Common validation helpers
export const validateId = z.string().uuid('Invalid ID format')
export const validateEmail = emailSchema
export const validatePassword = passwordSchema

// Schema validation helper function
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: z.ZodError
} {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}

// Format validation errors for API responses
export function formatValidationErrors(errors: z.ZodError): Array<{
  field: string
  message: string
  code: string
}> {
  return errors.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code
  }))
}