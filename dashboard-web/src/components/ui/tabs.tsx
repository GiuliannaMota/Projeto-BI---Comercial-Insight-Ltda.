import * as React from "react";
import { cn } from "../../lib/utils";

export interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onValueChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full gap-1 overflow-x-auto rounded-md border border-white/10 bg-white/[0.04] p-1",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "whitespace-nowrap rounded px-3 py-2 text-xs font-medium transition duration-200 ease-smooth active:translate-y-px",
              active ? "bg-violet-signal text-white" : "text-muted-foreground hover:bg-white/[0.07] hover:text-white",
            )}
            onClick={() => onValueChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
