import * as React from "react";
import { cn } from "../../lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  tone?: "lime" | "violet" | "red";
}

export function Progress({ value, tone = "lime", className, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const toneClass = {
    lime: "bg-lime-signal",
    violet: "bg-violet-signal",
    red: "bg-red-signal",
  }[tone];

  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-white/[0.07]", className)} {...props}>
      <div
        className={cn("h-full rounded-full transition-all duration-300 ease-smooth", toneClass)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
