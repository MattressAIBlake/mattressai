import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export const Card = ({ children, className, hover = false, glow = false }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-6",
        hover && "transition-all duration-300 hover:border-text-muted hover:bg-surface/80",
        glow && "shadow-lg shadow-accent/10",
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const CardHeader = ({ children, className }: CardHeaderProps) => {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4";
}

export const CardTitle = ({ children, className, as: Component = "h3" }: CardTitleProps) => {
  return (
    <Component className={cn("text-xl font-semibold text-text-primary tracking-tight", className)}>
      {children}
    </Component>
  );
};

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export const CardDescription = ({ children, className }: CardDescriptionProps) => {
  return (
    <p className={cn("text-text-secondary text-sm leading-relaxed", className)}>
      {children}
    </p>
  );
};

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent = ({ children, className }: CardContentProps) => {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
};
