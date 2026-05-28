import * as React from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  default:
    "border-white/10 bg-violet-signal/90 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-violet-signal hover:border-white/20 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_16px_-4px_rgba(124,92,255,0.35)]",
  secondary:
    "border-white/10 bg-white/[0.07] text-white hover:bg-white/[0.14] hover:border-white/20 hover:shadow-[0_4px_16px_-4px_rgba(148,163,184,0.12)]",
  ghost:
    "border-transparent bg-transparent text-muted-foreground hover:bg-white/[0.09] hover:border-white/10 hover:text-white",
  danger:
    "border-red-signal/30 bg-red-signal/15 text-red-100 hover:bg-red-signal/25 hover:border-red-signal/45 hover:shadow-[0_4px_16px_-4px_rgba(226,87,101,0.25)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  icon: "h-10 w-10 p-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-signal/70 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
