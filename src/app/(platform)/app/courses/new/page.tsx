import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { CourseForm } from "@/components/platform/courses/course-form";

export const metadata = platformMetadata("Criar curso");

export default function NewCoursePage() {
  return (
    <>
      <PageHeader
        title="Criar curso"
        description="Defina as informações principais. Depois você poderá estruturar módulos e aulas."
      />
      <CourseForm mode="create" />
    </>
  );
}
