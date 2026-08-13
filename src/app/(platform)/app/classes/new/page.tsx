import { platformMetadata } from "@/lib/platform/metadata";
import { CohortForm } from "@/components/platform/classes/cohort-form";

export const metadata = platformMetadata("Nova turma");

export default function NewClassPage() {
  return <CohortForm />;
}
