import { redirect } from "next/navigation";

/** Legacy route — Gate 10 uses assignment-based take URLs. */
export default async function LegacyAssessmentTakePage() {
  redirect("/app/my-assessments");
}
