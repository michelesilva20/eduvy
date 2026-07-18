import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { eduvyAssets } from "@/config/eduvy-assets";
import { LoginForm } from "@/components/auth/login-form";
import { EduvyIllustration, EduvyLogoImage } from "@/components/brand/eduvy-image";

export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Acesse sua plataforma Eduvy para gerenciar cursos, alunos e trilhas de aprendizagem.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <div className="min-h-svh bg-background">
      <div className="grid min-h-svh lg:grid-cols-2">
        {/* Formulário — esquerda no desktop */}
        <div className="relative flex flex-col justify-center px-4 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(203,185,255,0.25),transparent_55%)]"
            aria-hidden
          />

          <div className="relative mx-auto w-full max-w-md">
            <Link
              href="/"
              className="focus-ring mb-8 inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary lg:mb-10"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Voltar ao site
            </Link>

            <Link href="/" className="focus-ring mb-8 inline-block rounded-lg">
              <EduvyLogoImage priority size="lg" />
            </Link>

            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-card sm:p-8">
              <LoginForm />
            </div>

            <p className="mt-5 text-center text-[11px] leading-relaxed text-text-muted">
              Produto conceitual — login demonstrativo, sem autenticação real.
            </p>
          </div>
        </div>

        {/* Ilustração — direita no desktop */}
        <div className="relative hidden items-center justify-center overflow-hidden bg-background-purple-soft p-8 lg:flex xl:p-12">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(109,53,242,0.12),transparent_50%)]"
            aria-hidden
          />
          <EduvyIllustration
            asset={eduvyAssets.illustrations.login}
            sizes="50vw"
            className="relative max-h-[min(85vh,820px)] w-auto max-w-full object-contain"
            wrapperClassName="flex items-center justify-center"
          />
        </div>
      </div>

      {/* Ilustração compacta no mobile */}
      <div className="border-t border-border bg-background-purple-soft px-6 py-8 lg:hidden">
        <EduvyIllustration
          asset={eduvyAssets.illustrations.login}
          sizes="100vw"
          className="mx-auto max-h-64 w-auto max-w-sm object-contain opacity-95"
        />
      </div>
    </div>
  );
}
