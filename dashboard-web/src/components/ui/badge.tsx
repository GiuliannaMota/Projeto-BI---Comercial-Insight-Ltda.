import * as React from "react";
import { cn } from "../../lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "violet";

const variants: Record<BadgeVariant, string> = {
  default: "border-white/10 bg-white/[0.06] text-muted-foreground",
  success: "border-lime-signal/25 bg-lime-signal/12 text-lime-signal",
  warning: "border-amber-300/25 bg-amber-300/12 text-amber-100",
  danger: "border-red-signal/25 bg-red-signal/12 text-red-100",
  violet: "border-violet-signal/30 bg-violet-signal/14 text-violet-100",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium leading-none",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
