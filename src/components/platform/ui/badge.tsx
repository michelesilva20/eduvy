import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        success: "bg-emerald-500/10 text-emerald-700",
        warning: "bg-amber-500/10 text-amber-700",
        danger: "bg-red-500/10 text-red-700",
        info: "bg-sky-500/10 text-sky-700",
        muted: "bg-background-soft text-text-muted",
        outline: "border border-border-light text-text-muted",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const map: Record<string, BadgeProps["variant"]> = {
    active: "success",
    published: "success",
    inactive: "muted",
    draft: "warning",
    pending: "warning",
    archived: "muted",
    available: "info",
    locked: "danger",
    trial: "warning",
    included: "success",
    in_review: "info",
  };
  const labels: Record<string, string> = {
    active: "Ativo",
    published: "Publicado",
    inactive: "Inativo",
    draft: "Rascunho",
    pending: "Pendente",
    archived: "Arquivado",
    available: "Disponível",
    locked: "Bloqueado",
    trial: "Em teste",
    included: "Incluído",
    in_review: "Em revisão",
  };
  return (
    <Badge variant={map[normalized] ?? "muted"}>
      {labels[normalized] ?? status}
    </Badge>
  );
}
