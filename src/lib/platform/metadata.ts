import type { Metadata } from "next";

export function platformMetadata(title: string, description?: string): Metadata {
  return {
    title,
    description: description ?? `Gerencie ${title.toLowerCase()} na plataforma Eduvy.`,
    robots: { index: false, follow: false },
  };
}
