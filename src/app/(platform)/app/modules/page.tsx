import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { PlatformCard, PlatformCardBody } from "@/components/platform/shared/platform-card";
import { Badge, StatusBadge } from "@/components/platform/ui/badge";
import { Button } from "@/components/ui/button";
import { mockModules } from "@/mocks/platform";

export const metadata = platformMetadata("Módulos");

export default function ModulesPage() {
  return (
    <>
      <PageHeader title="Módulos" description="Ative e configure recursos adicionais contratáveis da Eduvy." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockModules.map((mod) => (
          <PlatformCard key={mod.id} interactive>
            <PlatformCardBody>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={mod.status} />
                {mod.isNew && <Badge variant="info">Novo</Badge>}
                {mod.isRecommended && <Badge variant="success">Recomendado</Badge>}
              </div>
              <h2 className="mt-3 font-[family-name:var(--font-sora)] text-lg font-bold text-text-primary">{mod.name}</h2>
              <p className="mt-2 text-sm text-text-muted">{mod.description}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{mod.category}</p>
              <div className="mt-4">
                {mod.status === "locked" || mod.status === "available" ? (
                  <Button size="sm">Ativar módulo</Button>
                ) : (
                  <Button size="sm" variant="secondary">Configurar</Button>
                )}
              </div>
            </PlatformCardBody>
          </PlatformCard>
        ))}
      </div>
    </>
  );
}
