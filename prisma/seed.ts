import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: { name: 'Demo Kitchen' },
    create: { name: 'Demo Kitchen', slug: 'demo' }
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUsers = [
    { email: 'super@demo.io', name: 'Super Admin', role: Role.SUPER_ADMIN },
    { email: 'admin@demo.io', name: 'Demo Admin', role: Role.TENANT_ADMIN },
    { email: 'editor@demo.io', name: 'Demo Editor', role: Role.TENANT_EDITOR },
    { email: 'demo@demo.io', name: 'Demo User', role: Role.USER }
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: user.email } },
      update: {},
      create: {
        tenantId: tenant.id,
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash
      }
    });
  }

  const [tomato, pasta, basil, oliveOil, garlic, parmesan] = await Promise.all([
    prisma.ingredient.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Tomato' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Tomato' }
    }),
    prisma.ingredient.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Pasta' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Pasta' }
    }),
    prisma.ingredient.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Basil' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Basil' }
    }),
    prisma.ingredient.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Olive Oil' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Olive Oil' }
    }),
    prisma.ingredient.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Garlic' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Garlic' }
    }),
    prisma.ingredient.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Parmesan' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Parmesan' }
    })
  ]);

  const [pot, knife, pan, blender] = await Promise.all([
    prisma.utensil.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Pot' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Pot' }
    }),
    prisma.utensil.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Knife' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Knife' }
    }),
    prisma.utensil.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Pan' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Pan' }
    }),
    prisma.utensil.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'Blender' } },
      update: {},
      create: { tenantId: tenant.id, name: 'Blender' }
    })
  ]);

  const demoUser = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: 'demo@demo.io' } }
  });

  if (demoUser) {
    await prisma.userPantryItem.createMany({
      data: [
        { tenantId: tenant.id, userId: demoUser.id, ingredientId: tomato.id },
        { tenantId: tenant.id, userId: demoUser.id, ingredientId: pasta.id },
        { tenantId: tenant.id, userId: demoUser.id, ingredientId: oliveOil.id },
        { tenantId: tenant.id, userId: demoUser.id, ingredientId: garlic.id }
      ],
      skipDuplicates: true
    });

    await prisma.userUtensil.createMany({
      data: [
        { tenantId: tenant.id, userId: demoUser.id, utensilId: pot.id },
        { tenantId: tenant.id, userId: demoUser.id, utensilId: knife.id }
      ],
      skipDuplicates: true
    });
  }

  const recipe = await prisma.recipe.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      tenantId: tenant.id,
      title: 'Quick Tomato Pasta',
      description: 'A fast weeknight pasta with fresh tomato sauce.',
      servings: 2,
      timeMinutes: 25,
      difficulty: 'Easy',
      tags: ['pasta', 'quick']
    }
  });

  await prisma.recipeIngredient.createMany({
    data: [
      { tenantId: tenant.id, recipeId: recipe.id, ingredientId: tomato.id, optional: false },
      { tenantId: tenant.id, recipeId: recipe.id, ingredientId: pasta.id, optional: false },
      { tenantId: tenant.id, recipeId: recipe.id, ingredientId: oliveOil.id, optional: false },
      { tenantId: tenant.id, recipeId: recipe.id, ingredientId: garlic.id, optional: false },
      { tenantId: tenant.id, recipeId: recipe.id, ingredientId: basil.id, optional: true },
      { tenantId: tenant.id, recipeId: recipe.id, ingredientId: parmesan.id, optional: true }
    ],
    skipDuplicates: true
  });

  await prisma.recipeUtensil.createMany({
    data: [
      { tenantId: tenant.id, recipeId: recipe.id, utensilId: pot.id, optional: false },
      { tenantId: tenant.id, recipeId: recipe.id, utensilId: knife.id, optional: false },
      { tenantId: tenant.id, recipeId: recipe.id, utensilId: pan.id, optional: true }
    ],
    skipDuplicates: true
  });

  await prisma.recipeStep.createMany({
    data: [
      {
        tenantId: tenant.id,
        recipeId: recipe.id,
        stepNumber: 1,
        instruction: 'Boil water in the pot and cook pasta until al dente.',
        timerSeconds: 600
      },
      {
        tenantId: tenant.id,
        recipeId: recipe.id,
        stepNumber: 2,
        instruction: 'Blend tomatoes, garlic, and olive oil until smooth.',
        timerSeconds: 30,
        speed: '6'
      },
      {
        tenantId: tenant.id,
        recipeId: recipe.id,
        stepNumber: 3,
        instruction: 'Simmer sauce for 5 minutes and toss with pasta.',
        timerSeconds: 300
      }
    ],
    skipDuplicates: true
  });

  const soup = await prisma.recipe.create({
    data: {
      tenantId: tenant.id,
      title: 'Creamy Basil Soup',
      description: 'Smooth soup finished with basil and parmesan.',
      servings: 2,
      timeMinutes: 30,
      difficulty: 'Medium',
      tags: ['soup', 'blender']
    }
  });

  await prisma.recipeIngredient.createMany({
    data: [
      { tenantId: tenant.id, recipeId: soup.id, ingredientId: tomato.id, optional: false },
      { tenantId: tenant.id, recipeId: soup.id, ingredientId: basil.id, optional: false },
      { tenantId: tenant.id, recipeId: soup.id, ingredientId: oliveOil.id, optional: false }
    ],
    skipDuplicates: true
  });

  await prisma.recipeUtensil.createMany({
    data: [
      { tenantId: tenant.id, recipeId: soup.id, utensilId: blender.id, optional: false },
      { tenantId: tenant.id, recipeId: soup.id, utensilId: pot.id, optional: false }
    ],
    skipDuplicates: true
  });

  await prisma.recipeStep.createMany({
    data: [
      {
        tenantId: tenant.id,
        recipeId: soup.id,
        stepNumber: 1,
        instruction: 'Warm tomatoes with olive oil in a pot.',
        timerSeconds: 240
      },
      {
        tenantId: tenant.id,
        recipeId: soup.id,
        stepNumber: 2,
        instruction: 'Blend with basil until silky.',
        timerSeconds: 40,
        speed: '8'
      }
    ],
    skipDuplicates: true
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
