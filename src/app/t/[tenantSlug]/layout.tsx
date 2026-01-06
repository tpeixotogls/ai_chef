import Link from 'next/link';
import { getTenantBySlug } from '@/lib/tenant';

export default async function TenantLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center text-center text-slate-200">
        Unknown tenant.
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{tenant.name}</p>
            <h1 className="text-lg font-semibold text-white">AI Chef</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link href={`/t/${tenant.slug}/dashboard`} className="hover:text-white">
              Dashboard
            </Link>
            <Link href={`/t/${tenant.slug}/recipes`} className="hover:text-white">
              Recipes
            </Link>
            <Link href={`/t/${tenant.slug}/pantry`} className="hover:text-white">
              Pantry
            </Link>
            <Link href={`/t/${tenant.slug}/utensils`} className="hover:text-white">
              Utensils
            </Link>
            <Link href={`/t/${tenant.slug}/admin/recipes`} className="hover:text-white">
              Admin
            </Link>
            <Link href={`/t/${tenant.slug}/admin/users`} className="hover:text-white">
              Users
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
