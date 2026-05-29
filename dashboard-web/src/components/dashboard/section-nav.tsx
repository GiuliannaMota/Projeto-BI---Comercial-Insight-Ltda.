import * as React from "react";
import { cn } from "../../lib/utils";

export interface NavSection {
  id: string;
  badge: string;
  label: string;
  color: string; // HSL hue for the dot
}

interface SectionNavProps {
  sections: NavSection[];
  activeId: string;
  progress: number; // 0 to 1
}

export function SectionNav({ sections, activeId, progress }: SectionNavProps) {
  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeIndex = sections.findIndex((s) => s.id === activeId);
  const progressHeight = sections.length > 1 ? (activeIndex / (sections.length - 1)) * 100 : 0;

  return (
    <nav
      className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 xl:flex"
      aria-label="Navegação por seções"
    >
      <div className="relative flex flex-col items-center gap-5">
        {/* Background track line */}
        <div
          className="absolute left-1/2 top-2 -translate-x-1/2 w-px bg-white/[0.08]"
          style={{ height: `calc(100% - 16px)` }}
        />

        {/* Progress fill line */}
        <div
          className="section-nav-line absolute left-1/2 top-2 -translate-x-1/2 w-px"
          style={{
            height: `${progressHeight}%`,
            maxHeight: `calc(100% - 16px)`,
            background: `hsl(${sections[activeIndex]?.color ?? "260"}, 54%, 62%)`,
          }}
        />

        {sections.map((section) => {
          const isActive = section.id === activeId;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => handleClick(section.id)}
              className="group/dot relative flex items-center gap-3"
              aria-label={`Ir para ${section.label}`}
              aria-current={isActive ? "true" : undefined}
            >
              {/* Dot */}
              <div
                className={cn("section-nav-dot relative z-10 h-2.5 w-2.5 rounded-full border-2", {
                  "border-transparent": !isActive,
                  "bg-white/20": !isActive,
                })}
                data-active={isActive}
                style={
                  isActive
                    ? {
                        borderColor: `hsl(${section.color}, 54%, 62%)`,
                        background: `hsl(${section.color}, 54%, 62%)`,
                        boxShadow: `0 0 12px hsla(${section.color}, 72%, 58%, 0.5)`,
                      }
                    : undefined
                }
              />

              {/* Label tooltip on hover or when active */}
              <span
                className={cn(
                  "pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-medium tracking-wide transition-all duration-200",
                  isActive
                    ? "border-white/15 bg-panel-strong/90 text-white opacity-100 backdrop-blur-md"
                    : "border-transparent bg-transparent text-transparent opacity-0 group-hover/dot:border-white/10 group-hover/dot:bg-panel-strong/90 group-hover/dot:text-slate-300 group-hover/dot:opacity-100 group-hover/dot:backdrop-blur-md",
                )}
              >
                <span className="mr-1 font-bold">{section.badge}</span>
                {section.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Hook to track which section is active via IntersectionObserver */
export function useActiveSection(sectionIds: string[]) {
  const [activeId, setActiveId] = React.useState(sectionIds[0] ?? "");

  React.useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const visibleSet = new Map<string, number>();

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visibleSet.set(id, entry.intersectionRatio);
            } else {
              visibleSet.delete(id);
            }
          });

          // Pick the section with highest visibility, or the first in order
          if (visibleSet.size > 0) {
            let best = sectionIds[0];
            let bestRatio = 0;
            for (const [sId, ratio] of visibleSet.entries()) {
              if (ratio > bestRatio || (ratio === bestRatio && sectionIds.indexOf(sId) < sectionIds.indexOf(best))) {
                best = sId;
                bestRatio = ratio;
              }
            }
            setActiveId(best);
          }
        },
        { threshold: [0, 0.1, 0.3, 0.5], rootMargin: "-120px 0px -40% 0px" },
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sectionIds]);

  const progress = React.useMemo(() => {
    const idx = sectionIds.indexOf(activeId);
    return sectionIds.length > 1 ? idx / (sectionIds.length - 1) : 0;
  }, [activeId, sectionIds]);

  return { activeId, progress };
}
