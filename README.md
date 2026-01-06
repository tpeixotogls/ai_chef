# AI Chef

AI Chef is a multi-tenant, guided cooking platform that only shows recipes a user can cook with their registered pantry items and utensils.

## Features

- Multi-tenant routing via `/t/{tenantSlug}`
- Roles: SUPER_ADMIN, TENANT_ADMIN, TENANT_EDITOR, USER
- Pantry + utensil management
- Guided cooking mode with step timers and local progress storage
- Eligible recipe matching via SQL filtering (no cross-tenant leakage)
- Admin recipe creation UI
- AI assistant endpoint for guided step rewrites and optional shopping list

## Local development

### 1. Start Postgres + Next.js

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Or with Docker Compose:

```bash
docker compose up
```

### 2. Sign in to the demo tenant

- URL: `http://localhost:3000/t/demo/login`
- Email: `demo@demo.io`
- Password: `password123`

Platform admin:

- URL: `http://localhost:3000/admin`
- Email: `super@demo.io`
- Password: `password123`

## API endpoints

- `GET /api/t/{tenantSlug}/recipes/eligible`
- `GET /api/t/{tenantSlug}/recipes/{recipeId}/why-not`
- `POST /api/t/{tenantSlug}/ai/assist` with JSON body:

```json
{
  "recipeId": "<uuid>",
  "mode": "eligible" // or "nearby" to include a shopping list
}
```

## Tests

```bash
npm run test
```

## Seed data

The seed script creates:

- Tenant: `demo`
- Users: demo admin/editor/user
- Ingredients and utensils
- Recipes with steps and metadata
