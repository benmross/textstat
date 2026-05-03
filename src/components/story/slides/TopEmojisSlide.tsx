"use client";

import { SlideShell } from "@/components/story/SlideShell";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface TopEmojisSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function TopEmojisSlide({
  stats,
  palette,
  isCurrent,
}: TopEmojisSlideProps) {
  if (!stats.topEmojis.length) return null;

  const te = stats.topEmojis.slice(0, 12);

  return (
    <SlideShell label="the emojis" palette={palette} isCurrent={isCurrent}>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        your signature emoji
      </div>
      <div className="text-[clamp(5rem,16vw,11rem)] leading-none drop-shadow-[0_12px_0_rgba(0,0,0,.1)]">
        {te[0].emoji}
      </div>
      <div className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        appearing {fmtNum(te[0].count)} times.
      </div>
      <div className="grid gap-3 w-[min(900px,100%)] mt-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}>
        {te.map((e) => (
          <div
            key={e.emoji}
            className="flex flex-col items-center gap-1 rounded-[18px] border border-white/20 bg-black/15 p-4"
          >
            <div className="text-[2.6rem] leading-none">{e.emoji}</div>
            <div className="font-mono text-sm opacity-80">{fmtNum(e.count)}</div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
