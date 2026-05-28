import { cn } from "../../lib/utils";

interface SectionHeaderProps {
  id: string;
  badge: string;
  question: string;
  description: string;
  badgeColor?: string;
}

const defaultBadgeColor = "border-violet-signal/30 bg-violet-signal/14 text-violet-100";

export function SectionHeader({ id, badge, question, description, badgeColor }: SectionHeaderProps) {
  return (
    <div id={id} className="scroll-mt-36 max-w-3xl pt-4">
      <div
        className={cn(
          "inline-flex rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em]",
          badgeColor ?? defaultBadgeColor,
        )}
      >
        {badge}
      </div>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-white md:text-2xl">{question}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
