import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { PlatformCard, PlatformCardBody } from "@/components/platform/shared/platform-card";
import { cn } from "@/lib/utils";

const categories = [
  { id: "org", label: "Organização" },
  { id: "brand", label: "Identidade visual" },
  { id: "users", label: "Usuários" },
  { id: "permissions", label: "Permissões" },
  { id: "notifications", label: "Notificações" },
  { id: "courses", label: "Cursos" },
  { id: "gamification", label: "Gamificação" },
  { id: "billing", label: "Plano e cobrança" },
  { id: "security", label: "Segurança" },
];

export const metadata = platformMetadata("Configurações");

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Configurações" description="Organize preferências da organização por categorias." />

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav aria-label="Categorias de configuração" className="flex gap-2 overflow-x-auto lg:w-56 lg:flex-col">
          {categories.map((cat, i) => (
            <button
              key={cat.id}
              type="button"
              className={cn(
                "focus-ring shrink-0 rounded-xl px-4 py-2.5 text-left text-sm font-medium lg:w-full",
                i === 0 ? "bg-background-purple-soft text-primary" : "text-text-muted hover:bg-background-soft",
              )}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        <PlatformCard className="flex-1">
          <PlatformCardBody>
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-bold text-text-primary">Organização</h2>
            <p className="mt-2 text-sm text-text-muted">
              Nome, domínio, fuso horário e dados institucionais. Formulários preparados para integração com API.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="font-medium text-text-primary">Nome da organização</span>
                <input className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-surface px-4" defaultValue="Preparatório Aurora" />
              </label>
              <label className="text-sm">
                <span className="font-medium text-text-primary">Plano atual</span>
                <input className="mt-1.5 h-11 w-full rounded-2xl border border-border bg-background-soft px-4" defaultValue="Profissional" readOnly />
              </label>
            </div>
          </PlatformCardBody>
        </PlatformCard>
      </div>
    </>
  );
}
