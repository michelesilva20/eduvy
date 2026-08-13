import { notFound } from "next/navigation";
import { platformMetadata } from "@/lib/platform/metadata";
import { fetchCourse } from "@/lib/courses/server";
import { fetchCourseStructure } from "@/lib/courses/structure";
import { CourseBuilderClient } from "@/components/platform/courses/course-builder-client";

export const metadata = platformMetadata("Builder do curso");

export default async function CourseBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: course, error: courseError }, { data: structure, error: structureError }] =
    await Promise.all([fetchCourse(id), fetchCourseStructure(id)]);

  if (!course) {
    if (courseError) {
      return (
        <div
          role="alert"
          className="rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {courseError}
        </div>
      );
    }
    notFound();
  }

  if (!structure) {
    return (
      <div
        role="alert"
        className="rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {structureError ?? "Não foi possível carregar a estrutura do curso."}
      </div>
    );
  }

  return <CourseBuilderClient course={course} initialStructure={structure} />;
}
