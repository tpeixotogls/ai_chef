import Link from 'next/link';
import { getTenantBySlug } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import CookingClient from './step-client';

export default async function CookPage({
  params
}: {
  params: { tenantSlug: string; recipeId: string };
}) {
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

  const recipe = await prisma.recipe.findFirst({
    where: { id: params.recipeId, tenantId: tenant.id },
    include: { steps: { orderBy: { stepNumber: 'asc' } } }
  });

  if (!recipe) {
    return <div className="text-slate-300">Recipe not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Guided cooking</p>
          <h2 className="text-2xl font-semibold text-white">{recipe.title}</h2>
        </div>
        <Link className="text-sm text-emerald-300" href={`/t/${params.tenantSlug}/recipes/${recipe.id}`}>
          Back to recipe
        </Link>
      </div>
      <CookingClient recipeId={recipe.id} steps={recipe.steps} />
    </div>
  );
}
