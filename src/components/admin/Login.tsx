'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { asset } from '@/lib/asset';
import { data } from '@/lib/data';
import { loginSchema, type LoginInput } from '@/lib/schemas';

export function Login({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const err = formState.errors;

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    const r = await data.login(v.email, v.password);
    if (!r.ok) return setError(r.error);
    onDone();
  });

  return (
    <main id="main" className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="dark relative hidden overflow-hidden bg-ofen text-mehl lg:block">
        <img src={asset('/media/film/d1280/095.webp')} alt="" className="absolute inset-0 size-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(15_12_10/0.9),transparent_60%)]" />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="display text-[5.5rem] leading-none font-[560]">Brace</p>
          <p className="mt-3 max-w-sm text-mehl/75">Küche. Bestellungen, Karte, Liefergebiete und Zahlen an einem Ort.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-16">
        <form onSubmit={onSubmit} noValidate className="w-full max-w-sm">
          <p className="display text-5xl font-[560] lg:hidden">Brace</p>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight lg:mt-0">Anmelden</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">Demo-Zugang: Die Daten stehen in docs/DEMO-ZUGANG.md im Projekt.</p>
          <FieldGroup className="mt-8">
            <Field data-invalid={!!err.email}>
              <FieldLabel htmlFor="email">E-Mail</FieldLabel>
              <Input id="email" type="email" spellCheck={false} autoComplete="username" className="h-11 text-base" aria-invalid={!!err.email} {...register('email')} />
              <FieldError errors={[err.email]} />
            </Field>
            <Field data-invalid={!!err.password}>
              <FieldLabel htmlFor="password">Passwort</FieldLabel>
              <Input id="password" type="password" autoComplete="current-password" className="h-11 text-base" aria-invalid={!!err.password} {...register('password')} />
              <FieldError errors={[err.password]} />
            </Field>
          </FieldGroup>
          {error && (
            <Alert variant="destructive" className="mt-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" variant="brand" size="cta" className="mt-7 w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting && <Spinner />}
            Anmelden
          </Button>
        </form>
      </div>
    </main>
  );
}
