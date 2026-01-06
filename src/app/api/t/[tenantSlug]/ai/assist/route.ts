import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getTenantBySlug } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { getMissingForRecipe } from '@/lib/matching';

const assistSchema = z.object({
  recipeId: z.string().uuid(),
  mode: z.enum(['eligible', 'nearby']).default('eligible')
});

function rewriteSteps(steps: { stepNumber: number; instruction: string; timerSeconds: number | null; temperatureC: number | null; speed: string | null }[]) {
  return steps.map((step) => {
    const parts = [
      `Step ${step.stepNumber}: ${step.instruction}`,
      step.temperatureC ? `Set temperature to ${step.temperatureC}°C.` : null,
      step.speed ? `Set speed to ${step.speed}.` : null,
      step.timerSeconds ? `Run for ${step.timerSeconds} seconds.` : null
    ].filter(Boolean);

    return parts.join(' ');
  });
}

export async function POST(request: Request, { params }: { params: { tenantSlug: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant || tenant.id !== session.user.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = assistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id: parsed.data.recipeId, tenantId: tenant.id },
    include: { steps: { orderBy: { stepNumber: 'asc' } } }
  });

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  const guidedSteps = rewriteSteps(recipe.steps);
  let shoppingList: { ingredients: string[]; utensils: string[] } | null = null;

  if (parsed.data.mode === 'nearby') {
    const missing = await getMissingForRecipe(tenant.id, session.user.id, recipe.id);
    shoppingList = {
      ingredients: missing.missingIngredients.map((item) => item.name),
      utensils: missing.missingUtensils.map((item) => item.name)
    };
  }

  return NextResponse.json({
    recipeId: recipe.id,
    guidedSteps,
    shoppingList
  });
}
