import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Modern-SaaS button styles: gradient primary, soft depth, hover-lift +
// active press, and a soft focus ring.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-input font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[.975] cursor-pointer",
  {
    variants: {
      variant: {
        // primary — indigo→violet gradient, lifts on hover
        primary:
          "bg-accent-gradient text-white shadow-primary hover:-translate-y-px hover:shadow-primary-lg",
        // ghost — plain, subtle hover
        ghost: "bg-transparent text-ink-2 hover:bg-hairline",
        // ghost with accent border (secondary accent)
        "ghost-accent":
          "bg-white text-accent border-[1.5px] border-accent-border hover:bg-accent-soft",
        // neutral secondary — crisp white, 1.5px border, accent on hover
        outline:
          "bg-white text-ink-2 border-[1.5px] border-border-strong hover:border-accent-border hover:text-accent",
      },
      size: {
        default: "h-[42px] px-[18px] text-[13.5px]",
        sm: "h-9 px-3.5 text-[13px]",
        lg: "h-[46px] px-6 text-[14px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
