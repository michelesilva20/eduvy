import Link from "next/link";
import { cn } from "@/lib/utils";
import { EduvyLogoImage } from "@/components/brand/eduvy-image";

interface EduvyLogoProps {
  className?: string;
  href?: string;
  /** @deprecated mantido por compatibilidade — não altera o visual */
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
}

export function EduvyLogo({ className, href = "/", size = "md" }: EduvyLogoProps) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center focus-ring rounded-lg", className)}
      aria-label="Eduvy — página inicial"
    >
      <EduvyLogoImage size={size} />
    </Link>
  );
}
