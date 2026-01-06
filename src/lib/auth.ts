import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantSlug: z.string().min(1)
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantSlug: { label: 'Tenant', type: 'text' }
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const { email, password, tenantSlug } = parsed.data;
        const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
        if (!tenant) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { tenantId_email: { tenantId: tenant.id, email } }
        });
        if (!user) {
          return null;
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: tenant.slug
        };
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role: string }).role;
        token.tenantId = (user as { tenantId: string }).tenantId;
        token.tenantSlug = (user as { tenantSlug: string }).tenantSlug;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
        session.user.tenantSlug = token.tenantSlug as string;
      }
      return session;
    }
  }
});

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      tenantId: string;
      tenantSlug: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    tenantId?: string;
    tenantSlug?: string;
  }
}
