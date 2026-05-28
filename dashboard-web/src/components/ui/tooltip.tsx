import * as React from "react";
import { cn } from "../../lib/utils";

interface TooltipProps {
  label: React.ReactNode;
  children: React.ReactElement;
  className?: string;
}

export function Tooltip({ label, children, className }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        className={cn(
          "pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-30 w-max max-w-64 -translate-x-1/2 rounded-md border border-white/10 bg-slate-950 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-xl transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
          className,
        )}
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
}
