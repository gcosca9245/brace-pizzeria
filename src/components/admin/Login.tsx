'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { PizzaIcon } from 'lucide-react';
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
    <main id="main" className="grid min-h-dvh place-items-center bg-[var(--e-canvas)] p-3 sm:p-6">
      <div className="grid w-full max-w-[1100px] gap-3 lg:grid-cols-[1fr_1.05fr]">
        <div className="flex flex-col rounded-[32px] bg-card p-6 sm:p-10">
          <p className="flex items-center gap-2 text-[19px] font-bold tracking-[-0.02em]">
            <span className="grid size-7 place-items-center rounded-full bg-[var(--e-accent)] text-white" aria-hidden="true">
              <PizzaIcon className="size-4" />
            </span>
            Brace
          </p>
          <form onSubmit={onSubmit} noValidate className="my-auto w-full max-w-sm pt-10 pb-4">
            <h1 className="text-[clamp(2.2rem,4vw,3rem)] leading-[1.02] font-semibold tracking-[-0.035em]">Willkommen in der Küche.</h1>
            <p className="mt-3 text-[15px] text-muted-foreground">Demo-Zugang: Die Daten stehen in docs/DEMO-ZUGANG.md im Projekt.</p>
            <FieldGroup className="mt-8">
              <Field data-invalid={!!err.email}>
                <FieldLabel htmlFor="email">E-Mail</FieldLabel>
                <Input id="email" type="email" spellCheck={false} autoComplete="username" className="h-12 rounded-full bg-secondary px-5 text-base" aria-invalid={!!err.email} {...register('email')} />
                <FieldError errors={[err.email]} />
              </Field>
              <Field data-invalid={!!err.password}>
                <FieldLabel htmlFor="password">Passwort</FieldLabel>
                <Input id="password" type="password" autoComplete="current-password" className="h-12 rounded-full bg-secondary px-5 text-base" aria-invalid={!!err.password} {...register('password')} />
                <FieldError errors={[err.password]} />
              </Field>
            </FieldGroup>
            {error && (
              <Alert variant="destructive" className="mt-5 rounded-[20px] border-0 bg-[var(--e-down-bg)] text-[var(--e-down)]">
                <AlertDescription className="text-[var(--e-down)]">{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="mt-7 h-12 w-full rounded-full bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/85" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <Spinner />}
              Anmelden
            </Button>
          </form>
        </div>
        <div className="relative hidden min-h-[620px] overflow-hidden rounded-[32px] bg-[var(--e-accent)] lg:block">
          <img src={asset('/media/film/d1280/120.webp')} alt="" loading="lazy" className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] rounded-[24px] object-cover" />
          <div className="absolute right-8 bottom-8 left-8 flex items-end justify-between gap-4">
            <div className="rounded-[24px] bg-[#262426] p-5 text-white">
              <p className="text-[13px] text-white/80">Heute geöffnet</p>
              <p className="mt-1 text-[28px] leading-none font-semibold tracking-[-0.03em]">17 – 22 Uhr</p>
            </div>
            <p className="max-w-[16ch] rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#12111a]">Bestellungen, Karte und Zahlen</p>
          </div>
        </div>
      </div>
    </main>
  );
}
