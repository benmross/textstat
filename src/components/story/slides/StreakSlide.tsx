"use client";

import { SlideShell } from "@/components/story/SlideShell";
import { Pill } from "@/components/shared/Pill";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum, fmtDateShort } from "@/lib/formatting";

interface StreakSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function StreakSlide({
  stats,
  palette,
  isCurrent,
}: StreakSlideProps) {
  const s = stats.summary;
  if (s.longestStreak <= 1) return null;

  return (
    <SlideShell label="your texting streak" palette={palette} isCurrent={isCurrent}>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        you sent messages every day for
      </div>
      <div className="text-[clamp(4.5rem,14vw,11rem)] font-black leading-[0.9] tracking-[-0.06em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {fmtNum(s.longestStreak)}
      </div>
      <div className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        days straight.
      </div>
      {s.streakStart && s.streakEnd && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Pill>
            {fmtDateShort(Date.parse(s.streakStart))} →{" "}
            {fmtDateShort(Date.parse(s.streakEnd))}
          </Pill>
        </div>
      )}
    </SlideShell>
  );
}
