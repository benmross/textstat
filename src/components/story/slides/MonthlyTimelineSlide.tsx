"use client";

import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum, fmtDateShort, MONTH_NAMES } from "@/lib/formatting";

interface MonthlyTimelineSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

const CHART_HEIGHT = 160;

export function MonthlyTimelineSlide({
  stats,
  palette,
  isCurrent,
}: MonthlyTimelineSlideProps) {
  const s = stats.summary;
  const months = stats.months;
  const max = months.reduce((a, m) => Math.max(a, m.count), 1);
  const maxIdx = months.reduce(
    (best, m, i) => (m.count > months[best].count ? i : best),
    0
  );

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="your year in texts" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        monthly volume
      </motion.div>
      <motion.div {...fu(0.08)} className="text-[clamp(1.2rem,2vw,1.6rem)] font-bold opacity-90">
        {fmtDateShort(s.firstTs)} → {fmtDateShort(s.lastTs)}
      </motion.div>

      <div className="flex gap-1.5 w-[min(900px,100%)] mt-6 items-end">
        {months.map((m, i) => {
          const [y, mo] = m.key.split("-").map(Number);
          const barH = Math.max(4, Math.round((m.count / max) * CHART_HEIGHT));
          const isPeak = i === maxIdx;

          return (
            <div
              key={m.key}
              className="flex-1 flex flex-col items-center gap-1"
              title={`${MONTH_NAMES[mo - 1]} ${y} — ${fmtNum(m.count)}`}
            >
              {/* count label above peak bar */}
              <div
                className="text-[0.6rem] font-mono font-bold transition-opacity duration-300"
                style={{
                  color: palette.fg,
                  opacity: isPeak ? 0.9 : 0,
                  height: "1rem",
                }}
              >
                {isPeak ? fmtNum(m.count) : ""}
              </div>

              {/* bar */}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: isCurrent ? 1 : 0 }}
                transition={{
                  duration: isCurrent ? 0.6 : 0.15,
                  delay: isCurrent ? i * 0.03 + 0.22 : 0,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="w-full rounded-t-md"
                style={{
                  height: `${barH}px`,
                  backgroundColor: palette.fg,
                  opacity: isPeak ? 1 : 0.55,
                  transformOrigin: "bottom",
                }}
              />

              {/* month label */}
              <div
                className="font-mono text-[0.65rem]"
                style={{ color: palette.fg, opacity: 0.8 }}
              >
                {MONTH_NAMES[mo - 1]}
              </div>

              {/* year label — show on Jan or first month */}
              <div
                className="font-mono text-[0.55rem]"
                style={{ color: palette.fg, opacity: 0.5 }}
              >
                {mo === 1 || i === 0 ? "'" + String(y).slice(2) : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* total messages summary */}
      <motion.div
        {...fu(0.7)}
        className="mt-5 text-[clamp(0.85rem,1.2vw,1rem)] opacity-70"
        style={{ color: palette.fg }}
      >
        {fmtNum(s.totalMessages)} messages total
      </motion.div>
    </SlideShell>
  );
}
