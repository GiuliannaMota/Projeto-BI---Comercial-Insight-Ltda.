import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  helper?: string;
  options: SelectOption[];
}

export function Select({ label, helper, options, className, id, ...props }: SelectProps) {
  const selectId = id ?? React.useId();

  return (
    <label htmlFor={selectId} className="grid gap-1.5 text-xs text-muted-foreground">
      {label ? <span className="font-medium text-slate-300">{label}</span> : null}
      <span className="relative block">
        <select
          id={selectId}
          className={cn(
            "h-10 w-full appearance-none rounded-md border border-white/10 bg-white/[0.06] px-3 pr-9 text-sm text-white outline-none transition duration-200 ease-smooth hover:bg-white/[0.09] focus:border-lime-signal/60 focus:ring-2 focus:ring-lime-signal/15",
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-950 text-white">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
      </span>
      {helper ? <span className="text-[11px] text-muted-foreground">{helper}</span> : null}
    </label>
  );
}
