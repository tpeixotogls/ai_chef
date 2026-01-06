import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTenantBySlug } from '@/lib/tenant';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const pantrySchema = z.object({
  name: z.string().min(2)
});

export default async function PantryPage({ params }: { params: { tenantSlug: string } }) {
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

  const pantryItems = await prisma.userPantryItem.findMany({
    where: { userId: session.user.id, tenantId: tenant.id },
    include: { ingredient: true },
    orderBy: { ingredient: { name: 'asc' } }
  });

  async function addPantryItem(formData: FormData) {
    'use server';
    const parsed = pantrySchema.safeParse({ name: formData.get('name') });
    if (!parsed.success || !tenant) {
      return;
    }
    const ingredient = await prisma.ingredient.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: parsed.data.name } },
      update: {},
      create: { tenantId: tenant.id, name: parsed.data.name }
    });
    await prisma.userPantryItem.upsert({
      where: { userId_ingredientId: { userId: session.user.id, ingredientId: ingredient.id } },
      update: {},
      create: { tenantId: tenant.id, userId: session.user.id, ingredientId: ingredient.id }
    });
    revalidatePath(`/t/${tenant.slug}/pantry`);
  }

  async function removePantryItem(formData: FormData) {
    'use server';
    const id = formData.get('id');
    if (typeof id !== 'string') {
      return;
    }
    await prisma.userPantryItem.deleteMany({
      where: { id, tenantId: tenant.id, userId: session.user.id }
    });
    revalidatePath(`/t/${tenant.slug}/pantry`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Pantry</h2>
        <p className="text-sm text-slate-400">Track the ingredients you currently have.</p>
      </div>

      <form action={addPantryItem} className="flex gap-2">
        <Input name="name" placeholder="Add ingredient" />
        <Button type="submit">Add</Button>
      </form>

      <div className="space-y-2">
        {pantryItems.length === 0 ? (
          <p className="text-sm text-slate-400">No pantry items yet.</p>
        ) : (
          pantryItems.map((item) => (
            <form key={item.id} action={removePantryItem} className="flex items-center justify-between rounded-md border border-slate-800 p-3">
              <span className="text-sm text-slate-100">{item.ingredient.name}</span>
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
