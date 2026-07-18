import { platformMetadata } from "@/lib/platform/metadata";
import { PlatformFeaturePage } from "@/components/platform/shared/platform-feature-page";
import { Badge } from "@/components/platform/ui/badge";

export const metadata = platformMetadata("Fórum");

export default function ForumPage() {
  return (
    <PlatformFeaturePage
      title="Fórum"
      description="Discussões moderadas por turma e tópico."
    >
      <Badge variant="info">Módulo disponível para ativação</Badge>
    </PlatformFeaturePage>
  );
}
