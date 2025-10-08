import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { PrismaClient } from '@prisma/client'
import { verifyPassword, PasswordAttemptTracker } from './auth/password'
import { loginSchema } from './validation/schemas'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  
  session: {
    strategy: 'jwt',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400'), // 24 hours default
    updateAge: parseInt(process.env.SESSION_UPDATE_AGE || '3600'), // 1 hour default
  },

  // Secure cookie configuration
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Host-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/dashboard'
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // Get client IP for security tracking
        const clientIP = req?.headers?.['x-forwarded-for'] || 
                        req?.headers?.['x-real-ip'] || 
                        'unknown'

        // Check rate limiting for login attempts
        const identifier = `${credentials.email}:${clientIP}`
        if (!PasswordAttemptTracker.canAttempt(identifier)) {
          const remaining = PasswordAttemptTracker.getRemainingAttempts(identifier)
          throw new Error(`Too many failed attempts. ${remaining} attempts remaining. Try again in 15 minutes.`)
        }

        try {
          // Validate input format
          const validatedData = loginSchema.parse({
            email: credentials.email,
            password: credentials.password
          })

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { 
              email: validatedData.email.toLowerCase() 
            },
            select: {
              id: true,
              email: true,
              password: true,
              name: true,
              role: true,
              emailVerified: true,
              deletedAt: true
            }
          })

          if (!user) {
            // Record failed attempt for non-existent user
            PasswordAttemptTracker.recordAttempt(identifier, false)
            throw new Error('Invalid email or password')
          }

          // Check if user account is deleted (soft delete)
          if (user.deletedAt) {
            throw new Error('Account has been deactivated')
          }

          // Check if user has a password (might be OAuth only)
          if (!user.password) {
            throw new Error('Please sign in with your OAuth provider')
          }

          // Verify password
          const isValidPassword = await verifyPassword(validatedData.password, user.password)
          
          if (!isValidPassword) {
            // Record failed password attempt
            PasswordAttemptTracker.recordAttempt(identifier, false)
            throw new Error('Invalid email or password')
          }

          // Check email verification for credential login
          if (!user.emailVerified) {
            throw new Error('Please verify your email before signing in')
          }

          // Record successful login attempt
          PasswordAttemptTracker.recordAttempt(identifier, true)

          // Return user object (password excluded)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified
          }

        } catch (error) {
          throw error
        }
      }
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code'
        }
      },
      allowDangerousEmailAccountLinking: true
    }),

    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID!,
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google' || account?.provider === 'azure-ad') {
          // OAuth provider login
          const email = user.email?.toLowerCase()
          
          if (!email) {
            return false
          }

          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { email }
          })

          if (!existingUser) {
            // Create new user for OAuth login
            existingUser = await prisma.user.create({
              data: {
                email,
                name: user.name || '',
                role: 'USER',
                emailVerified: new Date(), // OAuth emails are considered verified
              }
            })
            
          } else {
            // Update existing user's verification status
            if (!existingUser.emailVerified) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { emailVerified: new Date() }
              })
            }
          }

          // Check if account is soft deleted
          if (existingUser.deletedAt) {
            return false
          }

          // Update user object with database info
          user.id = existingUser.id
          user.role = existingUser.role
        }

        return true
      } catch (error) {
        return false
      }
    },

    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.role = user.role
        token.id = user.id
        token.emailVerified = user.emailVerified
      }

      // Add security timestamp
      if (!token.iat) {
        token.iat = Math.floor(Date.now() / 1000)
      }

      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.emailVerified = token.emailVerified as Date | null
      }

      return session
    }
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      // Sign-in event logged for audit
    },

    async signOut({ token }) {
      // Sign-out event logged for audit
    }
  },

  debug: process.env.NODE_ENV === 'development'
}