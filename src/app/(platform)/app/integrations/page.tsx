import { platformMetadata } from "@/lib/platform/metadata";
import { PlatformFeaturePage } from "@/components/platform/shared/platform-feature-page";

export const metadata = platformMetadata("Integrações");

export default function IntegrationsPage() {
  return (
    <PlatformFeaturePage
      title="Integrações"
      description="Conecte ferramentas externas à sua organização."
      actionLabel="Explorar módulos"
      actionHref="/app/modules"
      emptyTitle="Nenhuma integração ativa"
      emptyDescription="Google Workspace, Zoom, Stripe e webhooks estarão disponíveis aqui."
    />
  );
}
