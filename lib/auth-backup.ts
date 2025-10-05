import { NextAuthOptions } from 'next-auth'import { NextAuthOptions } from 'next-auth'import { NextAuthOptions } from 'next-auth'

import CredentialsProvider from 'next-auth/providers/credentials'

import GoogleProvider from 'next-auth/providers/google'import CredentialsProvider from 'next-auth/providers/credentials'import CredentialsProvider from 'next-auth/providers/credentials'

import AzureADProvider from 'next-auth/providers/azure-ad'

import { compare } from 'bcryptjs'import GoogleProvider from 'next-auth/providers/google'import GoogleProvider from 'next-auth/providers/google'

import { PrismaClient } from '@prisma/client'

import AzureADProvider from 'next-auth/providers/azure-ad'import AzureADProvider from 'next-auth/providers/azure-ad'

const prisma = new PrismaClient()

import { PrismaClient } from '@prisma/client'import { compare } from 'bcryptjs'

export const authOptions: NextAuthOptions = {

  secret: process.env.NEXTAUTH_SECRET,import { verifyPassword, PasswordAttemptTracker } from './auth/password'import { PrismaClient } from '@prisma/client'

  

  session: {import { loginSchema } from './validation/schemas'import { verifyPassword, PasswordAttemptTracker } from './auth/password'

    strategy: 'jwt',

    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400'),import { loginSchema } from './validation/schemas'

    updateAge: 3600,

  },const prisma = new PrismaClient()

  

  jwt: {const prisma = new PrismaClient()

    secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,

    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400'),// Enhanced session configuration for security

  },

  const SESSION_CONFIG = {// Enhanced session configuration for security

  providers: [

    GoogleProvider({  maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400'), // 24 hoursconst SESSION_CONFIG = {

      clientId: process.env.GOOGLE_CLIENT_ID!,

      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,  updateAge: 3600, // Update session every hour  maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400'), // 24 hours

      authorization: {

        params: {}  updateAge: 3600, // Update session every hour

          scope: 'openid email profile'

        }  generateSessionToken: () => crypto.randomUUID()

      }

    }),export const authOptions: NextAuthOptions = {}

    

    AzureADProvider({  secret: process.env.NEXTAUTH_SECRET,

      clientId: process.env.MICROSOFT_CLIENT_ID!,

      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,  export const authOptions: NextAuthOptions = {

      tenantId: process.env.MICROSOFT_TENANT_ID!,

    }),  session: {  secret: process.env.NEXTAUTH_SECRET,

    

    CredentialsProvider({    strategy: 'jwt',  

      name: 'credentials',

      credentials: {    maxAge: SESSION_CONFIG.maxAge,  session: {

        email: { label: 'Email', type: 'email' },

        password: { label: 'Password', type: 'password' }    updateAge: SESSION_CONFIG.updateAge,    strategy: 'jwt',

      },

      async authorize(credentials) {  },    maxAge: SESSION_CONFIG.maxAge,

        if (!credentials?.email || !credentials?.password) {

          throw new Error('Missing credentials')      updateAge: SESSION_CONFIG.updateAge,

        }

  jwt: {    generateSessionToken: SESSION_CONFIG.generateSessionToken

        try {

          const user = await prisma.user.findUnique({    secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,  },

            where: { 

              email: credentials.email.toLowerCase()     maxAge: SESSION_CONFIG.maxAge,  

            },

            select: {  },  jwt: {

              id: true,

              email: true,      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,

              name: true,

              password: true,  providers: [    maxAge: SESSION_CONFIG.maxAge,

              role: true,

              image: true,    GoogleProvider({  },

              deletedAt: true,

              emailVerified: true      clientId: process.env.GOOGLE_CLIENT_ID!,

            }

          })      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,export const authOptions: NextAuthOptions = {



          if (!user || !user.password || user.deletedAt) {      authorization: {  secret: process.env.NEXTAUTH_SECRET,

            throw new Error('Invalid credentials')

          }        params: {  



          const isPasswordValid = await compare(credentials.password, user.password)          scope: 'openid email profile'  providers: [

          

          if (!isPasswordValid) {        }    GoogleProvider({

            throw new Error('Invalid credentials')

          }      }      clientId: process.env.GOOGLE_CLIENT_ID!,



          console.log('✅ Successful login:', {     }),      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,

            userId: user.id, 

            email: user.email,          authorization: {

            timestamp: new Date().toISOString()

          })    AzureADProvider({        params: {



          return {      clientId: process.env.MICROSOFT_CLIENT_ID!,          scope: 'openid email profile'

            id: user.id,

            email: user.email,      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,        }

            name: user.name || '',

            role: user.role,      tenantId: process.env.MICROSOFT_TENANT_ID!,      }

            image: user.image

          }    }),    }),

        } catch (error) {

          console.error('❌ Auth error:', error)        

          return null

        }    CredentialsProvider({    AzureADProvider({

      }

    })      name: 'credentials',      clientId: process.env.MICROSOFT_CLIENT_ID!,

  ],

      credentials: {      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,

  callbacks: {

    async signIn({ user, account }) {        email: { label: 'Email', type: 'email' },      tenantId: process.env.MICROSOFT_TENANT_ID!,

      if (!user?.email) {

        return false        password: { label: 'Password', type: 'password' }    }),

      }

      },    

      try {

        const email = user.email.toLowerCase()      async authorize(credentials) {    CredentialsProvider({

        

        if (account?.provider && account.provider !== 'credentials') {        if (!credentials?.email || !credentials?.password) {      name: 'credentials',

          let existingUser = await prisma.user.findUnique({

            where: { email }          throw new Error('Missing credentials')      credentials: {

          })

        }        email: { label: 'Email', type: 'email' },

          if (existingUser) {

            await prisma.user.update({        password: { label: 'Password', type: 'password' }

              where: { id: existingUser.id },

              data: {        // Enhanced input validation      },

                name: user.name || existingUser.name,

                image: user.image || existingUser.image,        const validation = loginSchema.safeParse({      async authorize(credentials) {

                emailVerified: new Date()

              }          email: credentials.email,        if (!credentials?.email || !credentials?.password) {

            })

          } else {          password: credentials.password          throw new Error('Missing credentials')

            await prisma.user.create({

              data: {        })        }

                email,

                name: user.name || '',

                image: user.image,

                role: 'USER',        if (!validation.success) {        try {

                emailVerified: new Date()

              }          throw new Error('Invalid input format')          const user = await prisma.user.findUnique({

            })

          }        }            where: { 

        }

              email: credentials.email.toLowerCase() 

        return true

      } catch (error) {        const { email, password } = validation.data            }

        console.error('❌ Sign-in error:', error)

        return false        const clientIdentifier = email // Use email as rate limit identifier          })

      }

    },



    async jwt({ token, user, account }) {        // Check rate limiting for login attempts          if (!user || !user.password) {

      if (account) {

        token.provider = account?.provider        if (!PasswordAttemptTracker.canAttempt(clientIdentifier)) {            throw new Error('Invalid credentials')

      }

          const remaining = PasswordAttemptTracker.getRemainingAttempts(clientIdentifier)          }

      if (token.email && !token.id) {

        try {          throw new Error(`Too many login attempts. ${remaining} attempts remaining. Try again in 15 minutes.`)

          const dbUser = await prisma.user.findUnique({

            where: { email: token.email.toString().toLowerCase() }        }          const isPasswordValid = await compare(credentials.password, user.password)

          })

                    if (!isPasswordValid) {

          if (dbUser) {

            token.id = dbUser.id        try {            throw new Error('Invalid credentials')

            token.role = dbUser.role

            token.name = dbUser.name          const user = await prisma.user.findUnique({          }

            token.picture = dbUser.image || undefined

          }            where: { 

        } catch (error) {

          console.error('JWT callback error:', error)              email: email.toLowerCase()           return {

        }

      }            },            id: user.id,



      return token            select: {            email: user.email,

    },

              id: true,            name: user.name || '',

    async session({ session, token }) {

      if (session.user) {              email: true,            role: user.role,

        session.user.id = token.id as string

        session.user.role = token.role as string              name: true,            image: user.image

        session.user.provider = token.provider as string

      }              password: true,          }

      

      return session              role: true,        } catch (error) {

    },

              image: true,          console.error('Auth error:', error)

    async redirect({ url, baseUrl }) {

      if (url.includes('/login') || url.includes('/api/auth')) {              deletedAt: true,          return null

        return `${baseUrl}/dashboard`

      }              emailVerified: true        }

      return url.startsWith(baseUrl) ? url : baseUrl

    }            }      }

  },

          })    })

  events: {

    async signIn({ user }) {  ],

      console.log('🔐 User signed in:', user.email)

    },          if (!user || !user.password || user.deletedAt) {

    

    async signOut({ session }) {            PasswordAttemptTracker.recordAttempt(clientIdentifier, false)  callbacks: {

      console.log('🚪 User signed out:', session?.user?.email)

    }            throw new Error('Invalid credentials')    async signIn({ user, account }) {

  },

          }      console.log('🔐 Sign-in attempt:', { 

  pages: {

    signIn: '/login',        provider: account?.provider, 

    error: '/login',

  },          // Check if email is verified (optional - uncomment if needed)        email: user?.email 

}
          // if (!user.emailVerified) {      })

          //   throw new Error('Email not verified')

          // }      if (!user?.email) {

        console.error('❌ No email provided')

          const isPasswordValid = await verifyPassword(password, user.password)        return false

                }

          if (!isPasswordValid) {

            PasswordAttemptTracker.recordAttempt(clientIdentifier, false)      try {

            throw new Error('Invalid credentials')        const email = user.email.toLowerCase()

          }        

        // For OAuth providers, create or update user

          // Success - reset attempt counter        if (account?.provider && account.provider !== 'credentials') {

          PasswordAttemptTracker.recordAttempt(clientIdentifier, true)          console.log('🔄 Processing OAuth sign-in for:', account.provider)

          

          // Log successful login (for audit)          let existingUser = await prisma.user.findUnique({

          console.log('✅ Successful login:', {             where: { email }

            userId: user.id,           })

            email: user.email,

            timestamp: new Date().toISOString()          if (existingUser) {

          })            console.log('✅ Existing user found, updating...')

            await prisma.user.update({

          return {              where: { id: existingUser.id },

            id: user.id,              data: {

            email: user.email,                name: user.name || existingUser.name,

            name: user.name || '',                image: user.image || existingUser.image,

            role: user.role,                emailVerified: new Date(),

            image: user.image              }

          }            })

        } catch (error) {          } else {

          console.error('❌ Auth error:', error)            console.log('🆕 Creating new OAuth user...')

          return null            existingUser = await prisma.user.create({

        }              data: {

      }                email,

    })                name: user.name || '',

  ],                image: user.image,

                emailVerified: new Date(),

  callbacks: {                role: 'USER',

    async signIn({ user, account }) {              }

      console.log('🔐 Sign-in attempt:', {             })

        provider: account?.provider,           }

        email: user?.email           

      })          // Update user object with database info

          user.id = existingUser.id

      if (!user?.email) {          user.role = existingUser.role

        console.error('❌ No email provided')        }

        return false

      }        console.log('✅ Sign-in successful for:', user.email)

        return true

      try {        

        const email = user.email.toLowerCase()      } catch (error) {

                console.error('❌ Sign-in error:', error)

        // For OAuth providers, create or update user        return false

        if (account?.provider && account.provider !== 'credentials') {      }

          console.log('🔄 Processing OAuth sign-in for:', account.provider)    },

          

          let existingUser = await prisma.user.findUnique({    async jwt({ token, user, account }) {

            where: { email }      if (user) {

          })        token.id = user.id

        token.role = (user as { role?: string }).role || 'USER'

          if (existingUser) {        token.provider = account?.provider

            console.log('✅ Existing user found, updating...')      }

            await prisma.user.update({

              where: { id: existingUser.id },      // Always fetch fresh user data from database

              data: {      if (token.email && !token.id) {

                name: user.name || existingUser.name,        try {

                image: user.image || existingUser.image,          const dbUser = await prisma.user.findUnique({

                emailVerified: new Date() // OAuth emails are pre-verified            where: { email: token.email.toString().toLowerCase() }

              }          })

            })          

          } else {          if (dbUser) {

            console.log('👤 Creating new OAuth user...')            token.id = dbUser.id

            await prisma.user.create({            token.role = dbUser.role

              data: {            token.name = dbUser.name

                email,            token.picture = dbUser.image || undefined

                name: user.name || '',          }

                image: user.image,        } catch (error) {

                role: 'USER', // Default role for OAuth users          console.error('JWT callback error:', error)

                emailVerified: new Date()        }

              }      }

            })

          }      return token

        }    },



        return true    async session({ session, token }) {

      } catch (error) {      if (session.user) {

        console.error('❌ Sign-in error:', error)        session.user.id = token.id as string

        return false        session.user.role = token.role as string

      }        session.user.provider = token.provider as string

    },      }

      

    async jwt({ token, user, account }) {      console.log('📋 Session created:', {

      // Store provider info on first sign in        email: session.user?.email,

      if (account) {        role: session.user?.role,

        token.provider = account?.provider        id: session.user?.id

      }      })

      

      // Always fetch fresh user data from database      return session

      if (token.email && !token.id) {    },

        try {

          const dbUser = await prisma.user.findUnique({    async redirect({ url, baseUrl }) {

            where: { email: token.email.toString().toLowerCase() }      // Always redirect to dashboard after successful login

          })      if (url.includes('/login') || url.includes('/api/auth')) {

                  return `${baseUrl}/dashboard`

          if (dbUser) {      }

            token.id = dbUser.id      return url.startsWith(baseUrl) ? url : baseUrl

            token.role = dbUser.role    }

            token.name = dbUser.name  },

            token.picture = dbUser.image || undefined

          }  session: {

        } catch (error) {    strategy: 'jwt',

          console.error('JWT callback error:', error)    maxAge: 7 * 24 * 60 * 60, // 7 days

        }  },

      }

  pages: {

      return token    signIn: '/login',

    },    error: '/login',

  },

    async session({ session, token }) {

      if (session.user) {  events: {

        session.user.id = token.id as string    async signIn({ user }) {

        session.user.role = token.role as string      console.log('🎉 User signed in:', user.email)

        session.user.provider = token.provider as string    },

      }    async signOut({ session }) {

            console.log('👋 User signed out:', session?.user?.email)

      console.log('📋 Session created:', {    }

        email: session.user?.email,  },

        role: session.user?.role,

        id: session.user?.id  debug: process.env.NODE_ENV === 'development',

      })}
      
      return session
    },

    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after successful login
      if (url.includes('/login') || url.includes('/api/auth')) {
        return `${baseUrl}/dashboard`
      }
      return url.startsWith(baseUrl) ? url : baseUrl
    }
  },

  events: {
    async signIn({ user }) {
      console.log('🔐 User signed in:', user.email)
    },
    
    async signOut({ session }) {
      console.log('🚪 User signed out:', session?.user?.email)
    }
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
}