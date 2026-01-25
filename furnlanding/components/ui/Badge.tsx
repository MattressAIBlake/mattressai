import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

type BadgeVariant = "default" | "outline" | "accent" | "destructive";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface text-text-secondary border-border",
  outline: "bg-transparent text-text-muted border-border",
  accent: "bg-accent/10 text-accent border-accent/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/30",
};

export const Badge = ({ children, variant = "default", className }: BadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium font-mono",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
