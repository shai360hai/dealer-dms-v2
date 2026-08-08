import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-card)] text-sm font-medium transition-colors duration-200 ease-[var(--ease-signature)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-chrome-gold)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-navy)] text-[var(--color-porcelain)] hover:bg-[var(--color-navy-light)]",
        gold: "bg-[var(--color-chrome-gold)] text-[var(--color-ink)] hover:bg-[var(--color-chrome-gold-soft)]",
        outline: "border border-[var(--color-steel)] bg-transparent text-current hover:bg-[var(--color-porcelain-dim)]",
        ghost: "bg-transparent hover:bg-[var(--color-porcelain-dim)]",
        destructive: "bg-[var(--color-status-sold)] text-[var(--color-porcelain)] hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
