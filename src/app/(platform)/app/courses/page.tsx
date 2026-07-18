import { platformMetadata } from "@/lib/platform/metadata";
import { CoursesPageClient } from "@/components/platform/courses/courses-page-client";

export const metadata = platformMetadata("Cursos");

export default function CoursesPage() {
  return <CoursesPageClient />;
}
