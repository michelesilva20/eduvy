import type { CourseStatusCode } from "@eduvy/contracts";

export function courseStatusLabel(status: CourseStatusCode | string): string {
  const labels: Record<string, string> = {
    DRAFT: "Rascunho",
    IN_REVIEW: "Em revisão",
    PUBLISHED: "Publicado",
    ARCHIVED: "Arquivado",
  };
  return labels[status] ?? status;
}

export function courseStatusTone(
  status: CourseStatusCode | string,
): "warning" | "info" | "success" | "muted" {
  switch (status) {
    case "PUBLISHED":
      return "success";
    case "IN_REVIEW":
      return "info";
    case "ARCHIVED":
      return "muted";
    case "DRAFT":
    default:
      return "warning";
  }
}

export function formatWorkload(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
