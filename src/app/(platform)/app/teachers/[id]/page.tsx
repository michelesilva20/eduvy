import { notFound } from "next/navigation";
import { platformMetadata } from "@/lib/platform/metadata";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return platformMetadata(`Professor ${id}`);
}

export default async function TeacherDetailPage() {
  notFound();
}
