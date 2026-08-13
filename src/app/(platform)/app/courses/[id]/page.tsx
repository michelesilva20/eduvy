import { notFound } from "next/navigation";
import { platformMetadata } from "@/lib/platform/metadata";
import { fetchCourse } from "@/lib/courses/server";
import { CourseDetailClient } from "@/components/platform/courses/course-detail-client";

export const metadata = platformMetadata("Detalhes do curso");

export default async function CourseDetailPage({
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

  return <CourseDetailClient course={data} />;
}
