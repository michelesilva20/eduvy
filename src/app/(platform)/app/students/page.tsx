import { platformMetadata } from "@/lib/platform/metadata";
import { StudentsPageClient } from "@/components/platform/students/students-page-client";

export const metadata = platformMetadata("Alunos");

export default function StudentsPage() {
  return <StudentsPageClient />;
}
