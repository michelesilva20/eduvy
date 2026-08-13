import { platformMetadata } from "@/lib/platform/metadata";
import { AssessmentCreateForm } from "@/components/platform/assessments/assessment-create-form";

export const metadata = platformMetadata("Nova avaliação");

export default function NewAssessmentPage() {
  return <AssessmentCreateForm />;
}
