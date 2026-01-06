import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getTenantBySlug } from '@/lib/tenant';
import { requireRole } from '@/lib/authorization';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const recipeSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  servings: z.coerce.number().int().min(1),
  timeMinutes: z.coerce.number().int().min(1),
  difficulty: z.string().min(2),
  tags: z.string().optional(),
  ingredients: z.string().min(1),
  utensils: z.string().min(1),
  steps: z.string().min(1)
});

function parseList(input: string) {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export default async function AdminRecipesPage({ params }: { params: { tenantSlug: string } }) {
  const session = await requireRole('TENANT_EDITOR');
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant || tenant.id !== session.user.tenantId) {
    return <div className="text-slate-300">Unauthorized for this tenant.</div>;
  }

  const recipes = await prisma.recipe.findMany({
    where: { tenantId: tenant.id },
    orderBy: { title: 'asc' }
  });

  async function createRecipe(formData: FormData) {
    'use server';
    const parsed = recipeSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      servings: formData.get('servings'),
      timeMinutes: formData.get('timeMinutes'),
      difficulty: formData.get('difficulty'),
      tags: formData.get('tags'),
      ingredients: formData.get('ingredients'),
      utensils: formData.get('utensils'),
      steps: formData.get('steps')
    });

    if (!parsed.success || !tenant) {
      return;
    }

    const tags = parsed.data.tags
      ? parsed.data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];

    const ingredientsInput = parseList(parsed.data.ingredients);
    const utensilsInput = parseList(parsed.data.utensils);
    const stepsInput = parseList(parsed.data.steps);

    const recipe = await prisma.recipe.create({
      data: {
        tenantId: tenant.id,
        title: parsed.data.title,
        description: parsed.data.description,
        servings: parsed.data.servings,
        timeMinutes: parsed.data.timeMinutes,
        difficulty: parsed.data.difficulty,
        tags
      }
    });

    for (const item of ingredientsInput) {
      const [name, optionalFlag] = item.split('|').map((value) => value.trim());
      const ingredient = await prisma.ingredient.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name } },
        update: {},
        create: { tenantId: tenant.id, name }
      });
      await prisma.recipeIngredient.create({
        data: {
          tenantId: tenant.id,
          recipeId: recipe.id,
          ingredientId: ingredient.id,
          optional: optionalFlag === 'optional'
        }
      });
    }

    for (const item of utensilsInput) {
      const [name, optionalFlag] = item.split('|').map((value) => value.trim());
      const utensil = await prisma.utensil.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name } },
        update: {},
        create: { tenantId: tenant.id, name }
      });
      await prisma.recipeUtensil.create({
        data: {
          tenantId: tenant.id,
          recipeId: recipe.id,
          utensilId: utensil.id,
          optional: optionalFlag === 'optional'
        }
      });
    }

    let stepNumber = 1;
    for (const line of stepsInput) {
      const [instruction, timerSeconds, temperatureC, speed] = line.split('|').map((value) => value.trim());
      await prisma.recipeStep.create({
        data: {
          tenantId: tenant.id,
          recipeId: recipe.id,
          stepNumber,
          instruction,
          timerSeconds: timerSeconds ? Number.parseInt(timerSeconds, 10) : null,
          temperatureC: temperatureC ? Number.parseInt(temperatureC, 10) : null,
          speed: speed || null
        }
      });
      stepNumber += 1;
    }

    revalidatePath(`/t/${tenant.slug}/admin/recipes`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Recipe Admin</h2>
        <p className="text-sm text-slate-400">Create and manage recipes for your tenant.</p>
      </div>

      <form action={createRecipe} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <Input name="title" placeholder="Title" />
          <Input name="difficulty" placeholder="Difficulty (Easy, Medium, Hard)" />
          <Input name="servings" placeholder="Servings" type="number" />
          <Input name="timeMinutes" placeholder="Time minutes" type="number" />
        </div>
        <Input name="description" placeholder="Description" />
        <Input name="tags" placeholder="Tags (comma separated)" />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ingredients</p>
            <textarea
              name="ingredients"
              className="mt-2 h-32 w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-slate-100"
              placeholder="One per line. Format: name|optional"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Utensils</p>
            <textarea
              name="utensils"
              className="mt-2 h-32 w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-slate-100"
              placeholder="One per line. Format: name|optional"
            />
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Steps</p>
          <textarea
            name="steps"
            className="mt-2 h-40 w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-slate-100"
            placeholder="One per line. Format: instruction|timerSeconds|temperatureC|speed"
          />
        </div>
        <Button type="submit">Create recipe</Button>
      </form>

      <div className="space-y-3">
        {recipes.length === 0 ? (
          <p className="text-sm text-slate-400">No recipes yet.</p>
        ) : (
          recipes.map((recipe) => (
            <div key={recipe.id} className="flex items-center justify-between rounded-md border border-slate-800 p-4">
              <div>
                <p className="text-sm font-semibold text-white">{recipe.title}</p>
                <p className="text-xs text-slate-500">{recipe.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
