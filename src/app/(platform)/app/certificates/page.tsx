import { platformMetadata } from "@/lib/platform/metadata";
import { PlatformFeaturePage } from "@/components/platform/shared/platform-feature-page";

export const metadata = platformMetadata("Certificados");

export default function CertificatesPage() {
  return (
    <PlatformFeaturePage
      title="Certificados"
      description="Emissão automática e modelos personalizados."
      stats={[{ label: "Emitidos este semestre", value: "156" }]}
    />
  );
}
