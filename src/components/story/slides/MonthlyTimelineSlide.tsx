"use client";

import { SlideShell } from "@/components/story/SlideShell";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum, fmtDateShort, MONTH_NAMES } from "@/lib/formatting";

interface MonthlyTimelineSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function MonthlyTimelineSlide({
  stats,
  palette,
  isCurrent,
}: MonthlyTimelineSlideProps) {
  const s = stats.summary;
  const months = stats.months;
  const max = months.reduce((a, m) => Math.max(a, m.count), 1);

  return (
    <SlideShell label="your year in texts" palette={palette} isCurrent={isCurrent}>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        monthly volume
      </div>
      <div className="text-[clamp(1.2rem,2vw,1.6rem)] font-bold opacity-90">
        {fmtDateShort(s.firstTs)} → {fmtDateShort(s.lastTs)}
      </div>
      <div className="flex gap-1.5 w-[min(900px,100%)] h-[200px] mt-5 items-end">
        {months.map((m) => {
          const [y, mo] = m.key.split("-").map(Number);
          return (
            <div
              key={m.key}
              className="flex-1 flex flex-col items-center gap-1"
              title={`${MONTH_NAMES[mo - 1]} ${y} — ${fmtNum(m.count)}`}
            >
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t-md transition-all duration-[1.2s] min-h-0.5"
                  style={{
                    height: `${((m.count / max) * 100).toFixed(2)}%`,
                    backgroundColor: palette.fg,
                  }}
                />
              </div>
              <div className="font-mono text-[0.65rem] opacity-80">
                {MONTH_NAMES[mo - 1]}
              </div>
              <div className="font-mono text-[0.55rem] opacity-50">
                {mo === 1 || months.indexOf(m) === 0
                  ? "'" + String(y).slice(2)
                  : ""}
              </div>
            </div>
          );
        })}
      </div>
    </SlideShell>
  );
}
