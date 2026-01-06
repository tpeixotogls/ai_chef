import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getTenantBySlug } from '@/lib/tenant';
import { requireRole } from '@/lib/authorization';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['TENANT_ADMIN', 'TENANT_EDITOR', 'USER'])
});

export default async function AdminUsersPage({ params }: { params: { tenantSlug: string } }) {
  const session = await requireRole('TENANT_ADMIN');
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant || tenant.id !== session.user.tenantId) {
    return <div className="text-slate-300">Unauthorized for this tenant.</div>;
  }

  const users = await prisma.user.findMany({
    where: { tenantId: tenant.id },
    orderBy: { email: 'asc' }
  });

  async function createUser(formData: FormData) {
    'use server';
    const parsed = userSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role')
    });

    if (!parsed.success || !tenant) {
      return;
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role
      }
    });

    revalidatePath(`/t/${tenant.slug}/admin/users`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">User Management</h2>
        <p className="text-sm text-slate-400">Manage tenant users and roles.</p>
      </div>

      <form action={createUser} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <Input name="name" placeholder="Full name" />
          <Input name="email" placeholder="Email" type="email" />
          <Input name="password" placeholder="Temporary password" type="password" />
          <select
            name="role"
            className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
            defaultValue="USER"
          >
            <option value="TENANT_ADMIN">Tenant Admin</option>
            <option value="TENANT_EDITOR">Tenant Editor</option>
            <option value="USER">User</option>
          </select>
        </div>
        <Button type="submit">Create user</Button>
      </form>

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-md border border-slate-800 p-4">
            <div>
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email} • {user.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
