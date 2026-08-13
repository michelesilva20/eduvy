import { notFound } from "next/navigation";
import { platformMetadata } from "@/lib/platform/metadata";
import { fetchPlayerState } from "@/lib/learning/server";
import { LearningPlayerClient } from "@/components/platform/learning/learning-player-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const { data } = await fetchPlayerState(enrollmentId);
  return platformMetadata(data?.courseTitle ?? "Player");
}

export default async function LearningPlayerPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const { data, error } = await fetchPlayerState(enrollmentId);

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

  return <LearningPlayerClient initialState={data} />;
}
