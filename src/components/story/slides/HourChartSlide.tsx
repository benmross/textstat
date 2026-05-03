"use client";

import { SlideShell } from "@/components/story/SlideShell";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum, fmtHour } from "@/lib/formatting";

interface HourChartSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function HourChartSlide({
  stats,
  palette,
  isCurrent,
}: HourChartSlideProps) {
  const s = stats.summary;
  const sent = stats.hourSent;
  const recv = stats.hourRecv;
  const totals = sent.map((v, idx) => v + recv[idx]);
  const max = Math.max(...totals, 1);

  return (
    <SlideShell label="when you text" palette={palette} isCurrent={isCurrent}>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        your peak hour is
      </div>
      <div className="text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[0.9] tracking-[-0.04em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {fmtHour(s.peakHour)}
      </div>
      <div className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        {s.lateNightSentPct}% of your sent messages happen after 11 PM or before
        5 AM.
      </div>
      <div className="grid gap-1 w-[min(900px,100%)] h-[220px] mt-5 items-end max-md:h-[160px]"
        style={{ gridTemplateColumns: "repeat(24,1fr)" }}>
        {totals.map((v, h) => (
          <div
            key={h}
            className="relative flex flex-col items-center h-full"
            title={`${fmtHour(h)} — ${fmtNum(v)} messages`}
          >
            <div
              className="w-full rounded-t-md transition-all duration-1000 min-h-0.5"
              style={{
                height: `${((v / max) * 100).toFixed(2)}%`,
                backgroundColor: palette.fg,
              }}
            />
            <div className="font-mono text-[0.65rem] opacity-55 mt-1 h-[1em]">
              {h % 3 === 0
                ? h === 0
                  ? "12a"
                  : h === 12
                    ? "12p"
                    : (h % 12) + (h < 12 ? "a" : "p")
                : ""}
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
