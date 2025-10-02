import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import DiscordProvider from 'next-auth/providers/discord';
import AzureADProvider from 'next-auth/providers/azure-ad';
import LinkedInProvider from 'next-auth/providers/linkedin';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

import { NextAuthOptions } from 'next-auth';
// import { sendVerificationEmail, sendWelcomeEmail } from '@/lib/email';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt'
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      },
      profile(profile) {
        console.log('Google profile data:', profile); // Debug log
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
          role: 'USER' // Default role for OAuth users
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      authorization: {
        params: {
          scope: "read:user user:email"
        }
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          role: 'USER' // Default role for OAuth users
        }
      }
    }),
    ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET ? [
      DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        authorization: {
          params: {
            scope: "identify email"
          }
        }
      })
    ] : []),
    ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET ? [
      AzureADProvider({
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        tenantId: process.env.MICROSOFT_TENANT_ID,
        authorization: {
          params: {
            scope: "openid profile email"
          }
        }
      })
    ] : []),
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET ? [
      LinkedInProvider({
        clientId: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        authorization: {
          params: {
            scope: "r_liteprofile r_emailaddress"
          }
        }
      })
    ] : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = user.password ? await compare(
          credentials.password,
          user.password
        ) : false;

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      console.log('SignIn callback - User:', { name: user.name, email: user.email, image: user.image });
      console.log('SignIn callback - Account provider:', account?.provider);
      
      if (account?.provider === "email") {
        return true;
      }

      if (account?.provider === "credentials") {
        return true;
      }

      // For OAuth providers (Google, GitHub, etc.)
      if (account?.provider && account.provider !== "credentials" && account.provider !== "email") {
        try {
          // Check if user already exists with this email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (existingUser) {
            // Check if this OAuth account is already linked
            const existingAccount = await prisma.account.findFirst({
              where: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              }
            });

            if (!existingAccount) {
              // Link the OAuth account to the existing user
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                }
              });
            }

            // Update user info with OAuth data including image
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                emailVerified: new Date(),
              }
            });
          } else {
            // Create new user for OAuth provider
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                emailVerified: new Date(), // OAuth users are automatically verified
                role: 'USER', // Default role
                password: '', // OAuth users don't need password
              }
            });

            // Create the OAuth account record
            await prisma.account.create({
              data: {
                userId: newUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              }
            });
          }

          return true;
        } catch (error) {
          console.error("Error during OAuth sign in:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account, profile }) {
      // On initial sign-in, user object will be available
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
        token.picture = user.image || undefined;
      }
      
      // For OAuth sign-in, profile contains the OAuth provider data
      if (account && profile) {
        const profileData = profile as Record<string, unknown>
        token.picture = (profileData.picture as string) || (profileData.avatar_url as string) || user?.image || undefined;
      }
      
      // For subsequent requests, get user data from database
      if (account && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email }
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.emailVerified = dbUser.emailVerified;
            token.picture = dbUser.image || undefined;
          }
        } catch (error) {
          console.error('Error fetching user in JWT callback:', error);
        }
      }
      
      // Store OAuth provider info
      if (account) {
        token.provider = account.provider;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as Date;
        session.user.provider = token.provider as string;
        session.user.image = token.picture as string; // Add image to session
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login'
  },
  events: {
    async linkAccount({ user, account }) {
      // This event is triggered when an account is linked to a user
      console.log(`Account ${account.provider} linked to user ${user.email}`);
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
};
