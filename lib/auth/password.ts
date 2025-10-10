import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Environment-based password requirements
const MIN_PASSWORD_LENGTH = parseInt(process.env.MIN_PASSWORD_LENGTH || '12')
const REQUIRE_SPECIAL_CHARS = process.env.REQUIRE_SPECIAL_CHARS === 'true'
const REQUIRE_NUMBERS = process.env.REQUIRE_NUMBERS === 'true'
const REQUIRE_UPPERCASE = process.env.REQUIRE_UPPERCASE === 'true'

// Production-grade password schema
export const passwordSchema = z.string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
  )
  .refine((password) => {
    if (!REQUIRE_UPPERCASE && !REQUIRE_NUMBERS && !REQUIRE_SPECIAL_CHARS) return true
    
    const checks = [
      !REQUIRE_UPPERCASE || /[A-Z]/.test(password),
      !REQUIRE_NUMBERS || /\d/.test(password),
      !REQUIRE_SPECIAL_CHARS || /[@$!%*?&]/.test(password)
    ]
    
    return checks.every(Boolean)
  }, 'Password does not meet security requirements')

// Common weak passwords to reject
const WEAK_PASSWORDS = [
  'password123', 'admin123', 'qwerty123', 'welcome123',
  '123456789', 'password!', 'admin!@#', 'qwerty!@#'
]

// Enhanced password validation
export const validatePassword = (password: string) => {
  try {
    passwordSchema.parse(password)
    
    // Check against common weak passwords
    if (WEAK_PASSWORDS.includes(password.toLowerCase())) {
      throw new Error('Password is too common. Please choose a more unique password.')
    }
    
    // Check for sequential characters
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)/i.test(password)) {
      throw new Error('Password cannot contain sequential characters.')
    }
    
    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      throw new Error('Password cannot contain more than 2 repeated characters in a row.')
    }
    
    return { valid: true, message: 'Password meets all requirements' }
  } catch (error) {
    return { 
      valid: false, 
      message: error instanceof Error ? error.message : 'Invalid password'
    }
  }
}

// Production-grade password hashing
export async function hashPassword(password: string): Promise<string> {
  // Validate password before hashing
  const validation = validatePassword(password)
  if (!validation.valid) {
    throw new Error(validation.message)
  }
  
  // Use high salt rounds for production security
  const saltRounds = process.env.NODE_ENV === 'production' ? 14 : 12
  return bcrypt.hash(password, saltRounds)
}

// Secure password verification
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number // 0-100
  feedback: string[]
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'
} {
  let score = 0
  const feedback: string[] = []
  
  // Length scoring
  if (password.length >= 12) score += 25
  else if (password.length >= 8) score += 15
  else feedback.push('Use at least 12 characters')
  
  // Character variety scoring
  if (/[a-z]/.test(password)) score += 15
  else feedback.push('Add lowercase letters')
  
  if (/[A-Z]/.test(password)) score += 15
  else feedback.push('Add uppercase letters')
  
  if (/\d/.test(password)) score += 15
  else feedback.push('Add numbers')
  
  if (/[@$!%*?&]/.test(password)) score += 15
  else feedback.push('Add special characters (@$!%*?&)')
  
  // Complexity bonus
  if (password.length >= 16) score += 10
  if (/[^A-Za-z\d@$!%*?&]/.test(password)) score += 5 // Additional special chars
  
  // Determine strength level
  let level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'
  if (score >= 85) level = 'very-strong'
  else if (score >= 70) level = 'strong'
  else if (score >= 55) level = 'good'
  else if (score >= 40) level = 'fair'
  else level = 'weak'
  
  return { score, feedback, level }
}

// Generate secure random password
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const special = '@$!%*?&'
  
  // Ensure at least one of each required character type
  let password = ''
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]
  
  // Fill remaining length with random characters
  const allChars = lowercase + uppercase + numbers + special
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password to randomize character positions
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Rate limiting for password attempts
export class PasswordAttemptTracker {
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map()
  private static MAX_ATTEMPTS = 20 // Increased from 5 to 20 for production with multiple users
  private static WINDOW_MS = 15 * 60 * 1000 // 15 minutes
  
  static canAttempt(identifier: string): boolean {
    const now = Date.now()
    const record = this.attempts.get(identifier)
    
    if (!record) return true
    
    // Reset if window time has passed
    if (now - record.lastAttempt > this.WINDOW_MS) {
      this.attempts.delete(identifier)
      return true
    }
    
    // Allow up to MAX_ATTEMPTS per window
    return record.count < this.MAX_ATTEMPTS
  }
  
  static recordAttempt(identifier: string, success: boolean): void {
    const now = Date.now()
    
    if (success) {
      this.attempts.delete(identifier)
      return
    }
    
    const record = this.attempts.get(identifier) || { count: 0, lastAttempt: 0 }
    record.count += 1
    record.lastAttempt = now
    
    this.attempts.set(identifier, record)
  }
  
  static getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier)
    if (!record) return this.MAX_ATTEMPTS
    
    const now = Date.now()
    if (now - record.lastAttempt > this.WINDOW_MS) {
      return this.MAX_ATTEMPTS
    }
    
    return Math.max(0, this.MAX_ATTEMPTS - record.count)
  }
  
  // Cleanup old records periodically
  static cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.attempts.entries()) {
      if (now - record.lastAttempt > this.WINDOW_MS) {
        this.attempts.delete(key)
      }
    }
  }
}