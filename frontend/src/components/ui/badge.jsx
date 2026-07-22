import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Status pills / band labels. Chip text ~11–12px / 700.
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-bold text-[11.5px] leading-none px-3 py-1.5",
  {
    variants: {
      tone: {
        green: "bg-green-soft text-green-text",
        amber: "bg-amber-soft text-amber-text",
        red: "bg-red-soft text-red-text",
        accent: "bg-accent-soft text-accent",
        neutral: "bg-hairline-2 text-ink-2",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

function Badge({ className, tone, dot = false, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
