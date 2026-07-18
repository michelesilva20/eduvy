import { platformMetadata } from "@/lib/platform/metadata";
import { CourseWizardClient } from "@/components/platform/courses/course-wizard";

export const metadata = platformMetadata("Criar curso");

export default function NewCoursePage() {
  return <CourseWizardClient />;
}
