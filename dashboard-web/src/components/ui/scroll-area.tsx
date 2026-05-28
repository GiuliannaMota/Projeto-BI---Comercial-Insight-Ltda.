import * as React from "react";
import { cn } from "../../lib/utils";

export function ScrollArea({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-auto [scrollbar-color:rgba(148,163,184,0.45)_transparent] [scrollbar-width:thin]",
        className,
      )}
      {...props}
    />
  );
}
