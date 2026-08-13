import { Suspense } from "react";
import { platformMetadata } from "@/lib/platform/metadata";
import { fetchCourses } from "@/lib/courses/server";
import { CoursesPageClient } from "@/components/platform/courses/courses-page-client";

export const metadata = platformMetadata("Cursos");

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string; sort?: string }>;
}) {
  const query = await searchParams;
  const { data, error } = await fetchCourses(query);

  return (
    <Suspense fallback={<p className="text-sm text-text-muted">Carregando cursos…</p>}>
      <CoursesPageClient initialData={data} error={error} />
    </Suspense>
  );
}
