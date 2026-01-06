import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getTenantBySlug } from '@/lib/tenant';
import { getEligibleRecipes } from '@/lib/matching';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage({ params }: { params: { tenantSlug: string } }) {
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

  const recipes = await getEligibleRecipes(tenant.id, session.user.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {session.user.name}</CardTitle>
          <CardDescription>Find recipes you can cook right now.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            className="inline-flex rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
            href={`/t/${params.tenantSlug}/recipes`}
          >
            Browse Recipes
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {recipes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No eligible recipes yet</CardTitle>
              <CardDescription>Add pantry items or utensils to unlock recipes.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          recipes.map((recipe) => (
            <Card key={recipe.id}>
              <CardHeader>
                <CardTitle>{recipe.title}</CardTitle>
                <CardDescription>{recipe.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{recipe.timeMinutes} min • {recipe.difficulty}</span>
                <Link className="text-sm text-emerald-300" href={`/t/${params.tenantSlug}/recipes/${recipe.id}`}>
                  View
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
