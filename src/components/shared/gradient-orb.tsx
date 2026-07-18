import { cn } from "@/lib/utils";

interface GradientOrbProps {
  className?: string;
  color?: "purple" | "green" | "gold";
  size?: "sm" | "md" | "lg";
}

const colorMap = {
  purple: "from-primary/40 to-primary-bright/20",
  green: "from-secondary/30 to-secondary/10",
  gold: "from-achievement/40 to-achievement/15",
};

const sizeMap = {
  sm: "size-32",
  md: "size-48",
  lg: "size-72",
};

export function GradientOrb({
  className,
  color = "purple",
  size = "md",
}: GradientOrbProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full bg-gradient-to-br blur-3xl",
        colorMap[color],
        sizeMap[size],
        className,
      )}
    />
  );
}
