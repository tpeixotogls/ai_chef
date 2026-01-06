'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage({ params }: { params: { tenantSlug: string } }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      tenantSlug: params.tenantSlug
    });

    if (result?.error) {
      setError('Invalid credentials.');
      return;
    }

    router.push(`/t/${params.tenantSlug}/dashboard`);
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tenant</p>
        <h2 className="text-2xl font-semibold text-white">Sign in to {params.tenantSlug}</h2>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>
      <p className="text-xs text-slate-500">Demo credentials: demo@demo.io / password123</p>
    </div>
  );
}
