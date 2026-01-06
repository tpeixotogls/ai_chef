import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/authorization';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const tenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  adminEmail: z.string().email(),
  adminName: z.string().min(2),
  adminPassword: z.string().min(6)
});

export default async function PlatformAdminPage() {
  await requireRole('SUPER_ADMIN');

  const tenants = await prisma.tenant.findMany({ orderBy: { name: 'asc' } });

  async function createTenant(formData: FormData) {
    'use server';
    const parsed = tenantSchema.safeParse({
      name: formData.get('name'),
      slug: formData.get('slug'),
      adminEmail: formData.get('adminEmail'),
      adminName: formData.get('adminName'),
      adminPassword: formData.get('adminPassword')
    });

    if (!parsed.success) {
      return;
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug
      }
    });

    const passwordHash = await bcrypt.hash(parsed.data.adminPassword, 10);
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: parsed.data.adminEmail,
        name: parsed.data.adminName,
        passwordHash,
        role: 'TENANT_ADMIN'
      }
    });

    revalidatePath('/admin');
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Platform Admin</h2>
        <p className="text-sm text-slate-400">Create tenants and tenant admins.</p>
      </div>

      <form action={createTenant} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <Input name="name" placeholder="Tenant name" />
          <Input name="slug" placeholder="Tenant slug" />
          <Input name="adminName" placeholder="Admin name" />
          <Input name="adminEmail" placeholder="Admin email" type="email" />
          <Input name="adminPassword" placeholder="Admin password" type="password" />
        </div>
        <Button type="submit">Create tenant</Button>
      </form>

      <div className="space-y-2">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="flex items-center justify-between rounded-md border border-slate-800 p-4">
            <div>
              <p className="text-sm font-semibold text-white">{tenant.name}</p>
              <p className="text-xs text-slate-500">/{tenant.slug}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
