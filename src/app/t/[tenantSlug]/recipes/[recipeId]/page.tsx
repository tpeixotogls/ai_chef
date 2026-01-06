import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getTenantBySlug } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { getMissingForRecipe } from '@/lib/matching';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function RecipeDetailPage({
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
    return (
      <div className="text-slate-300">
        Please <Link href={`/t/${params.tenantSlug}/login`} className="text-emerald-300">sign in</Link>.
      </div>
    );
  }
  if (session.user.tenantId !== tenant.id) {
    return <div className="text-slate-300">Unauthorized for this tenant.</div>;
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id: params.recipeId, tenantId: tenant.id },
    include: {
      ingredients: { include: { ingredient: true } },
      utensils: { include: { utensil: true } },
      steps: { orderBy: { stepNumber: 'asc' } }
    }
  });

  if (!recipe) {
    return <div className="text-slate-300">Recipe not found.</div>;
  }

  const missing = await getMissingForRecipe(tenant.id, session.user.id, recipe.id);
  const eligible = missing.missingIngredients.length === 0 && missing.missingUtensils.length === 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{recipe.title}</CardTitle>
          <CardDescription>{recipe.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-slate-400">{recipe.timeMinutes} min • {recipe.servings} servings • {recipe.difficulty}</div>
          <div>
            <p className="text-sm font-semibold text-white">Ingredients</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {recipe.ingredients.map((item) => (
                <li key={item.id}>
                  {item.optional ? 'Optional: ' : ''}{item.ingredient.name}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Utensils</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {recipe.utensils.map((item) => (
                <li key={item.id}>
                  {item.optional ? 'Optional: ' : ''}{item.utensil.name}
                </li>
              ))}
            </ul>
          </div>
          {eligible ? (
            <p className="text-sm text-emerald-300">Eligible because you have all required ingredients and utensils.</p>
          ) : (
            <div className="text-sm text-rose-300">
              <p>Missing required items:</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {missing.missingIngredients.map((item) => (
                  <li key={item.id}>{item.name}</li>
                ))}
                {missing.missingUtensils.map((item) => (
                  <li key={item.id}>{item.name}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950" href={`/t/${params.tenantSlug}/cook/${recipe.id}`}>
              Start cooking
            </Link>
            <Link className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-100" href={`/t/${params.tenantSlug}/recipes`}>
              Back to recipes
            </Link>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Steps</CardTitle>
          <CardDescription>Preview the guided steps.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recipe.steps.map((step) => (
            <div key={step.id} className="rounded-md border border-slate-800 p-3">
              <p className="text-sm font-semibold text-white">Step {step.stepNumber}</p>
              <p className="text-sm text-slate-300">{step.instruction}</p>
              <p className="text-xs text-slate-500">
                {step.timerSeconds ? `Timer: ${step.timerSeconds}s` : ''}
                {step.temperatureC ? ` • Temp: ${step.temperatureC}°C` : ''}
                {step.speed ? ` • Speed: ${step.speed}` : ''}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
