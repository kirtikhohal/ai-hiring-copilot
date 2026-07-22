import * as React from "react";
import { cn } from "@/lib/utils";

// Base card: 16px radius, 1px border, rest shadow (README §Spacing).
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-card border border-border bg-surface shadow-card",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export { Card };
