"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { loginCopy } from "@/data/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormErrors {
  email?: string;
  password?: string;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(false);

    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = loginCopy.validation.emailRequired;
    } else if (!validateEmail(email)) {
      nextErrors.email = loginCopy.validation.emailInvalid;
    }

    if (!password) {
      nextErrors.password = loginCopy.validation.passwordRequired;
    } else if (password.length < 6) {
      nextErrors.password = loginCopy.validation.passwordMin;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsLoading(false);
    setSubmitted(true);
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

      {submitted && (
        <div
          role="status"
          className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-secondary/[0.05] p-4"
        >
          <div className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <div>
              <p className="font-[family-name:var(--font-sora)] text-sm font-bold text-[#3d3654]">
                Acesso liberado na demo
              </p>
              <p className="mt-1 font-[family-name:var(--font-nunito)] text-sm text-text-muted">
                {loginCopy.demoNotice}
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="mt-4 w-full sm:w-auto">
            <Link href="/app">
              Acessar plataforma
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
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
              title="Demonstração — em breve"
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
