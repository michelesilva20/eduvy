"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Sparkles, Zap } from "lucide-react";
import { loginCopy } from "@/data/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormErrors {
  email?: string;
  password?: string;
  form?: string;
  apiOffline?: boolean;
}

const isDev = process.env.NODE_ENV === "development";
const demo = loginCopy.quickAccess;

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoPassword, setShowDemoPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const fillDemoCredentials = () => {
    setEmail(demo.email);
    setPassword(demo.password);
    setRemember(true);
    setErrors({});
  };

  const loginWithCredentials = async (inputEmail: string, inputPassword: string) => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inputEmail.trim(),
          password: inputPassword,
          rememberMe: remember,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
          code?: string;
        } | null;
        const apiOffline = response.status === 503 || body?.code === "API_OFFLINE";
        setErrors({
          form: apiOffline
            ? (body?.message ?? loginCopy.errors.apiOffline)
            : (body?.message ?? loginCopy.errors.generic),
          apiOffline,
        });
        return;
      }

      const next = searchParams.get("next");
      router.push(next?.startsWith("/app") ? next : "/app");
      router.refresh();
    } catch {
      setErrors({ form: loginCopy.errors.generic });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    fillDemoCredentials();
    await loginWithCredentials(demo.email, demo.password);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = loginCopy.validation.emailRequired;
    } else if (!validateEmail(email)) {
      nextErrors.email = loginCopy.validation.emailInvalid;
    }

    if (!password) {
      nextErrors.password = loginCopy.validation.passwordRequired;
    } else if (password.length < 8) {
      nextErrors.password = loginCopy.validation.passwordMin;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await loginWithCredentials(email, password);
  };

  return (
    <div className="w-full">
      <div className="mb-7 lg:mb-8">
        <h2 className="font-[family-name:var(--font-sora)] text-2xl font-bold text-[#3d3654] sm:text-[1.75rem]">
          {loginCopy.title}
        </h2>
        <p className="mt-1.5 font-[family-name:var(--font-nunito)] text-sm text-text-muted">
          {loginCopy.subtitle}
        </p>
      </div>

      {isDev && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] to-secondary/[0.04]">
          <div className="flex items-start gap-3 border-b border-primary/10 px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Zap className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-[family-name:var(--font-sora)] text-sm font-bold text-[#3d3654]">
                {demo.title}
              </p>
              <p className="text-xs text-text-muted">{demo.subtitle}</p>
            </div>
          </div>

          <div className="space-y-2 px-4 py-3">
            <div className="rounded-xl border border-border/80 bg-surface/80 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {demo.label}
              </p>
              <dl className="mt-1.5 space-y-1 font-mono text-xs text-[#3d3654]">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <dt className="text-text-muted">E-mail</dt>
                  <dd className="font-semibold">{demo.email}</dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <dt className="text-text-muted">Senha</dt>
                  <dd className="font-semibold">
                    {showDemoPassword ? demo.password : "••••••••••"}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => setShowDemoPassword((prev) => !prev)}
                className="focus-ring mt-2 text-[11px] font-semibold text-primary hover:text-primary-bright"
              >
                {showDemoPassword ? "Ocultar senha" : "Mostrar senha"}
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-10 flex-1"
                disabled={isLoading}
                onClick={fillDemoCredentials}
              >
                {demo.fillButton}
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-10 flex-1"
                disabled={isLoading}
                onClick={() => void handleQuickLogin()}
              >
                <Sparkles className="size-4" aria-hidden />
                {isLoading ? "Entrando…" : demo.submitButton}
              </Button>
            </div>
          </div>
        </div>
      )}

      {errors.form && (
        <div
          role="alert"
          className={cn(
            "mb-6 rounded-2xl border px-4 py-3 text-sm",
            errors.apiOffline
              ? "border-amber-200 bg-amber-50 text-amber-950"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          <p>{errors.form}</p>
          {errors.apiOffline && (
            <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs leading-relaxed opacity-90">
              <li>Abra o Docker Desktop</li>
              <li>
                No terminal: <code className="rounded bg-amber-100/80 px-1">pnpm infra:up</code>
              </li>
              <li>
                Em outro terminal: <code className="rounded bg-amber-100/80 px-1">pnpm dev:api</code>
              </li>
              <li>Tente entrar novamente</li>
            </ol>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">{loginCopy.emailLabel}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={loginCopy.emailPlaceholder}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="h-12"
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-600" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">{loginCopy.passwordLabel}</Label>
            <button
              type="button"
              className="focus-ring rounded font-[family-name:var(--font-nunito)] text-xs font-semibold text-primary hover:text-primary-bright"
              title="Em breve"
            >
              {loginCopy.forgotPassword}
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={loginCopy.passwordPlaceholder}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="h-12 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted hover:text-text-dark"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-sm text-red-600" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-transparent px-0.5 py-1 transition-colors hover:border-border-light">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="focus-ring size-4 rounded border-border-light text-primary accent-primary"
          />
          <span className="font-[family-name:var(--font-nunito)] text-sm text-text-muted">
            {loginCopy.rememberMe}
          </span>
        </label>

        <Button
          type="submit"
          size="lg"
          className="group h-12 w-full"
          disabled={isLoading}
        >
          {isLoading ? "Entrando…" : loginCopy.submit}
          {!isLoading && (
            <ArrowRight
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          )}
        </Button>
      </form>

      <div className="mt-8 border-t border-border-light pt-6 text-center">
        <p className="font-[family-name:var(--font-nunito)] text-sm text-text-muted">
          {loginCopy.noAccount}{" "}
          <Link
            href="/#cta-final"
            className={cn(
              "focus-ring rounded font-semibold text-primary hover:text-primary-bright",
            )}
          >
            {loginCopy.createPlatform}
          </Link>
        </p>
      </div>
    </div>
  );
}
