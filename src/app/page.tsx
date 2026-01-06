import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-full bg-slate-800 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
        Multi-tenant AI Chef
      </span>
      <h1 className="text-4xl font-semibold text-white md:text-5xl">Cook with confidence using what you already have.</h1>
      <p className="max-w-2xl text-base text-slate-300">
        AI Chef filters recipes to match your pantry and utensils, then guides you through each step in a
        Thermomix-style experience.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950"
          href="/t/demo/login"
        >
          Visit Demo Tenant
        </Link>
        <a
          className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-100"
          href="https://localhost:3000"
        >
          View Docs in README
        </a>
      </div>
    </main>
  );
}
