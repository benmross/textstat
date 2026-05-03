"use client";

import { SlideShell } from "@/components/story/SlideShell";
import { Avatar } from "@/components/shared/Avatar";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface TopContactsListSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function TopContactsListSlide({
  stats,
  palette,
  isCurrent,
}: TopContactsListSlideProps) {
  if (stats.topContacts.length <= 1) return null;

  const top = stats.topContacts.slice(0, 8);
  const max = top[0].total;

  return (
    <SlideShell label="your top contacts" palette={palette} isCurrent={isCurrent}>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        the people in your inbox
      </div>
      <div className="text-[clamp(1.2rem,2vw,1.6rem)] font-bold opacity-90">
        top 8
      </div>
      <div className="flex flex-col gap-[0.55rem] w-[min(680px,100%)] mt-4">
        {top.map((c, idx) => (
          <div
            key={idx}
            className="grid items-center gap-[0.6rem]"
            style={{
              gridTemplateColumns: "28px 36px 1.2fr 2fr auto",
            }}
          >
            <div className="font-mono text-sm opacity-55">#{idx + 1}</div>
            <Avatar entry={c} size="sm" />
            <div className="font-bold text-left whitespace-nowrap overflow-hidden text-ellipsis">
              {c.displayName}
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-black/15">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${((c.total / max) * 100).toFixed(2)}%`,
                  backgroundColor: palette.fg,
                }}
              />
            </div>
            <div className="font-mono text-sm min-w-[50px] text-right">
              {fmtNum(c.total)}
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
