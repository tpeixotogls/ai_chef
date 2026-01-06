import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getTenantBySlug } from '@/lib/tenant';
import { getEligibleRecipes } from '@/lib/matching';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function RecipesPage({ params }: { params: { tenantSlug: string } }) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) {
    return <div className="text-slate-300">Tenant not found.</div>;
  }

  const session = await auth();
  if (!session?.user) {
    return (
      <div className="text-slate-300">
        Please <Link href={`/t/${params.tenantSlug}/login`} className="text-emerald-300">sign in</Link>.
      </div>
    );
  }
  if (session.user.tenantId !== tenant.id) {
    return <div className="text-slate-300">Unauthorized for this tenant.</div>;
  }

  const [eligible, all] = await Promise.all([
    getEligibleRecipes(tenant.id, session.user.id),
    prisma.recipe.findMany({
      where: { tenantId: tenant.id },
      orderBy: { title: 'asc' }
    })
  ]);

  const eligibleIds = new Set(eligible.map((recipe) => recipe.id));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Eligible recipes</CardTitle>
          <CardDescription>Only recipes you can make with your pantry and utensils.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {eligible.length === 0 ? (
            <p className="text-sm text-slate-400">No eligible recipes yet.</p>
          ) : (
            eligible.map((recipe) => (
              <div key={recipe.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{recipe.title}</p>
                  <p className="text-xs text-slate-500">Eligible because you have all required ingredients and utensils.</p>
                </div>
                <Link className="text-sm text-emerald-300" href={`/t/${params.tenantSlug}/recipes/${recipe.id}`}>
                  Cook
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All recipes</CardTitle>
          <CardDescription>See what is available across the catalog.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {all.map((recipe) => (
            <div key={recipe.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{recipe.title}</p>
                <p className="text-xs text-slate-500">
                  {eligibleIds.has(recipe.id) ? 'Eligible now.' : 'Check why not.'}
                </p>
              </div>
              <Link className="text-sm text-emerald-300" href={`/t/${params.tenantSlug}/recipes/${recipe.id}`}>
                View
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
