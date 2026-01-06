import { auth } from '@/lib/auth';

export const roleRank = {
  USER: 1,
  TENANT_EDITOR: 2,
  TENANT_ADMIN: 3,
  SUPER_ADMIN: 4
} as const;

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireRole(minRole: keyof typeof roleRank) {
  const session = await requireAuth();
  const currentRole = session.user.role as keyof typeof roleRank;
  if (roleRank[currentRole] < roleRank[minRole]) {
    throw new Error('Forbidden');
  }
  return session;
}
