import { platformMetadata } from "@/lib/platform/metadata";
import { fetchMyCourses } from "@/lib/learning/server";
import { MyCoursesClient } from "@/components/platform/learning/my-courses-client";

export const metadata = platformMetadata("Meus cursos");

export default async function MyCoursesPage() {
  const { data, error } = await fetchMyCourses();
  return <MyCoursesClient courses={data} error={error} />;
}
