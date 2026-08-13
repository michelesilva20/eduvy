import { notFound } from "next/navigation";
import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { CourseForm } from "@/components/platform/courses/course-form";
import { fetchCourse } from "@/lib/courses/server";

export const metadata = platformMetadata("Editar curso");

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, error } = await fetchCourse(id);

  if (!data) {
    if (error) {
      return (
        <div
          role="alert"
          className="rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      );
    }
    notFound();
  }

  return (
    <>
      <PageHeader
        title="Editar curso"
        description="Atualize as informações principais do curso."
      />
      <CourseForm mode="edit" initial={data} />
    </>
  );
}
