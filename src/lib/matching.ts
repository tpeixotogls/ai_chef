import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function getEligibleRecipes(tenantId: string, userId: string) {
  const recipes = await prisma.$queryRaw<
    {
      id: string;
      title: string;
      description: string;
      servings: number;
      timeMinutes: number;
      difficulty: string;
      tags: string[];
    }[]
  >(
    Prisma.sql`
      SELECT r.id, r.title, r.description, r."servings", r."timeMinutes", r.difficulty, r.tags
      FROM "Recipe" r
      WHERE r."tenantId" = ${tenantId}
        AND NOT EXISTS (
          SELECT 1 FROM "RecipeIngredient" ri
          WHERE ri."recipeId" = r.id
            AND ri.optional = false
            AND NOT EXISTS (
              SELECT 1 FROM "UserPantryItem" up
              WHERE up."userId" = ${userId}
                AND up."ingredientId" = ri."ingredientId"
            )
        )
        AND NOT EXISTS (
          SELECT 1 FROM "RecipeUtensil" ru
          WHERE ru."recipeId" = r.id
            AND ru.optional = false
            AND NOT EXISTS (
              SELECT 1 FROM "UserUtensil" uu
              WHERE uu."userId" = ${userId}
                AND uu."utensilId" = ru."utensilId"
            )
        )
      ORDER BY r.title ASC
    `
  );

  return recipes;
}

export async function getMissingForRecipe(tenantId: string, userId: string, recipeId: string) {
  const missingIngredients = await prisma.$queryRaw<{ id: string; name: string }[]>(
    Prisma.sql`
      SELECT i.id, i.name
      FROM "RecipeIngredient" ri
      JOIN "Ingredient" i ON i.id = ri."ingredientId"
      WHERE ri."recipeId" = ${recipeId}
        AND ri."tenantId" = ${tenantId}
        AND ri.optional = false
        AND NOT EXISTS (
          SELECT 1 FROM "UserPantryItem" up
          WHERE up."userId" = ${userId}
            AND up."ingredientId" = ri."ingredientId"
        )
      ORDER BY i.name ASC
    `
  );

  const missingUtensils = await prisma.$queryRaw<{ id: string; name: string }[]>(
    Prisma.sql`
      SELECT u.id, u.name
      FROM "RecipeUtensil" ru
      JOIN "Utensil" u ON u.id = ru."utensilId"
      WHERE ru."recipeId" = ${recipeId}
        AND ru."tenantId" = ${tenantId}
        AND ru.optional = false
        AND NOT EXISTS (
          SELECT 1 FROM "UserUtensil" uu
          WHERE uu."userId" = ${userId}
            AND uu."utensilId" = ru."utensilId"
        )
      ORDER BY u.name ASC
    `
  );

  return { missingIngredients, missingUtensils };
}
