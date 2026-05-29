import * as React from "react";
import { createPortal } from "react-dom";
import { BarChart3, BookOpen, Info, Lightbulb } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ReadingContent {
  sobre: string;
  comoAnalisar: string;
  insight: string;
}

interface ReadingIconButtonProps {
  open: boolean;
  onClick: () => void;
  ariaLabel: string;
  className?: string;
}

export const ReadingIconButton = React.forwardRef<HTMLButtonElement, ReadingIconButtonProps>(
  ({ open, onClick, ariaLabel, className }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      aria-expanded={open}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-signal/70",
        open
          ? "border-lime-signal/35 bg-lime-signal/15 text-lime-signal"
          : "border-white/10 bg-white/[0.045] text-muted-foreground hover:border-white/20 hover:bg-white/[0.09] hover:text-slate-200",
        className,
      )}
      onClick={onClick}
    >
      <Info className="h-3.5 w-3.5" strokeWidth={2} />
    </button>
  ),
);
ReadingIconButton.displayName = "ReadingIconButton";

export function ReadingPanel({ reading, className }: { reading: ReadingContent; className?: string }) {
  return (
    <div className={cn("reading-panel space-y-3 p-4", className)}>
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/[0.06]">
          <BookOpen className="h-3 w-3 text-slate-400" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Sobre</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{reading.sobre}</p>
        </div>
      </div>

      <div className="border-t border-white/[0.08]" />

      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-violet-signal/12">
          <BarChart3 className="h-3 w-3 text-violet-100" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-100">Como ler</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{reading.comoAnalisar}</p>
        </div>
      </div>

      <div className="border-t border-white/[0.08]" />

      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-lime-signal/12">
          <Lightbulb className="h-3 w-3 text-lime-signal" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-signal">Ponto de atencao</p>
          <p className="mt-1 text-xs leading-relaxed text-lime-signal/90">{reading.insight}</p>
        </div>
      </div>
    </div>
  );
}

interface ReadingPopoverProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  reading: ReadingContent;
  onClose: () => void;
}

export function ReadingPopover({ anchorRef, open, reading, onClose }: ReadingPopoverProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState({ left: 16, top: 16 });

  const updatePosition = React.useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(352, window.innerWidth - 32);
    const height = panelRef.current?.offsetHeight ?? 260;
    const left = Math.max(16, Math.min(rect.right - width, window.innerWidth - width - 16));
    const belowTop = rect.bottom + 8;
    const aboveTop = rect.top - height - 8;
    const top = belowTop + height <= window.innerHeight - 16 ? belowTop : Math.max(16, aboveTop);
    setPosition({ left, top });
  }, [anchorRef]);

  React.useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition, reading]);

  React.useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, onClose, open, updatePosition]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[80] w-[min(22rem,calc(100vw-2rem))]"
      style={{ left: position.left, top: position.top }}
    >
      <ReadingPanel reading={reading} />
    </div>,
    document.body,
  );
}
