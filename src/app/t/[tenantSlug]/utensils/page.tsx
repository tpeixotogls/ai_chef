import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTenantBySlug } from '@/lib/tenant';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const utensilSchema = z.object({
  name: z.string().min(2)
});

export default async function UtensilsPage({ params }: { params: { tenantSlug: string } }) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) {
    return <div className="text-slate-300">Tenant not found.</div>;
  }

  const session = await auth();
  if (!session?.user) {
    return <div className="text-slate-300">Please sign in.</div>;
  }
  if (session.user.tenantId !== tenant.id) {
    return <div className="text-slate-300">Unauthorized for this tenant.</div>;
  }

  const utensils = await prisma.userUtensil.findMany({
    where: { userId: session.user.id, tenantId: tenant.id },
    include: { utensil: true },
    orderBy: { utensil: { name: 'asc' } }
  });

  async function addUtensil(formData: FormData) {
    'use server';
    const parsed = utensilSchema.safeParse({ name: formData.get('name') });
    if (!parsed.success || !tenant) {
      return;
    }
    const utensil = await prisma.utensil.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: parsed.data.name } },
      update: {},
      create: { tenantId: tenant.id, name: parsed.data.name }
    });
    await prisma.userUtensil.upsert({
      where: { userId_utensilId: { userId: session.user.id, utensilId: utensil.id } },
      update: {},
      create: { tenantId: tenant.id, userId: session.user.id, utensilId: utensil.id }
    });
    revalidatePath(`/t/${tenant.slug}/utensils`);
  }

  async function removeUtensil(formData: FormData) {
    'use server';
    const id = formData.get('id');
    if (typeof id !== 'string') {
      return;
    }
    await prisma.userUtensil.deleteMany({
      where: { id, tenantId: tenant.id, userId: session.user.id }
    });
    revalidatePath(`/t/${tenant.slug}/utensils`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Utensils</h2>
        <p className="text-sm text-slate-400">Track the tools you have in your kitchen.</p>
      </div>

      <form action={addUtensil} className="flex gap-2">
        <Input name="name" placeholder="Add utensil" />
        <Button type="submit">Add</Button>
      </form>

      <div className="space-y-2">
        {utensils.length === 0 ? (
          <p className="text-sm text-slate-400">No utensils yet.</p>
        ) : (
          utensils.map((item) => (
            <form key={item.id} action={removeUtensil} className="flex items-center justify-between rounded-md border border-slate-800 p-3">
              <span className="text-sm text-slate-100">{item.utensil.name}</span>
              <input type="hidden" name="id" value={item.id} />
              <Button type="submit" variant="outline">
                Remove
              </Button>
            </form>
          ))
        )}
      </div>
    </div>
  );
}
