import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { EmptyState } from "@/components/platform/shared/empty-state";

export const metadata = platformMetadata("Módulos");

export default function ModulesPage() {
  return (
    <>
      <PageHeader title="Módulos" description="Ative e configure recursos adicionais contratáveis da Eduvy." />
      <EmptyState
        title="Módulos ainda não configurados"
        description="Redações, simulados, fórum e integrações aparecerão aqui conforme forem habilitados para sua organização."
        actionLabel="Ver configurações"
        actionHref="/app/settings"
      />
    </>
  );
}
