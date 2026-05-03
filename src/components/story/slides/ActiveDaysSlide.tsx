"use client";

import { SlideShell } from "@/components/story/SlideShell";
import { Pill } from "@/components/shared/Pill";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum, fmtYmd } from "@/lib/formatting";

interface ActiveDaysSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function ActiveDaysSlide({ stats, palette, isCurrent }: ActiveDaysSlideProps) {
  const s = stats.summary;
  const activePct = s.totalDays
    ? Math.round((100 * s.activeDays) / s.totalDays)
    : 0;

  return (
    <SlideShell label="always on" palette={palette} isCurrent={isCurrent}>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        over those
      </div>
      <div className="text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[0.9] tracking-[-0.04em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {fmtNum(s.totalDays)} days
      </div>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        you sent or received a message on
      </div>
      <div className="text-[clamp(4.5rem,14vw,11rem)] font-black leading-[0.9] tracking-[-0.06em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {fmtNum(s.activeDays)}
      </div>
      <div className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        of them — that&apos;s {activePct}% of your days.
      </div>
      {s.busiest && s.busiest.ymd && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Pill>busiest day: {fmtYmd(s.busiest.ymd)}</Pill>
          <Pill alt>{fmtNum(s.busiest.count)} messages that day</Pill>
        </div>
      )}
    </SlideShell>
  );
}
