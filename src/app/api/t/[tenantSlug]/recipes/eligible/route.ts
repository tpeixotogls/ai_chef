import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenantBySlug } from '@/lib/tenant';
import { getEligibleRecipes } from '@/lib/matching';

export async function GET(
  _request: Request,
  { params }: { params: { tenantSlug: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant || tenant.id !== session.user.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const recipes = await getEligibleRecipes(tenant.id, session.user.id);
  return NextResponse.json({
    recipes,
    explanation: 'Eligible because you have all required ingredients and utensils.'
  });
}
