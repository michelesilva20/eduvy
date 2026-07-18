import * as React from "react";
import { cn } from "@/lib/utils";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "font-[family-name:var(--font-nunito)] text-sm font-semibold text-text-dark",
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label };
