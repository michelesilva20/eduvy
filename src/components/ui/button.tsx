import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-[family-name:var(--font-nunito)] text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-primary-light text-text-light shadow-lg shadow-primary/20 hover:from-primary-hover hover:to-primary hover:shadow-primary/30",
        secondary:
          "border border-border bg-surface text-text-primary hover:border-primary/25 hover:bg-background-purple-soft",
        soft:
          "bg-primary/10 text-primary hover:bg-primary/15",
        ghost:
          "text-text-muted hover:bg-primary/5 hover:text-text-dark",
        outline:
          "border border-primary/30 bg-transparent text-primary hover:border-primary hover:bg-primary/5",
        dark:
          "bg-primary text-text-light hover:bg-primary-bright",
        achievement:
          "bg-achievement text-text-dark hover:brightness-105",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs rounded-xl",
        lg: "h-12 px-8 text-base rounded-2xl",
        icon: "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
