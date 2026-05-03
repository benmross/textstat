"use client";

import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum, DOW_NAMES, DOW_NAMES_LONG } from "@/lib/formatting";

interface DayOfWeekSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function DayOfWeekSlide({
  stats,
  palette,
  isCurrent,
}: DayOfWeekSlideProps) {
  const s = stats.summary;
  const dowSent = stats.dowSent;
  const dowRecv = stats.dowRecv;
  const totals = dowSent.map((v, idx) => v + dowRecv[idx]);
  const max = Math.max(...totals, 1);

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="day by day" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        your loudest day of the week is
      </motion.div>
      <motion.div {...fu(0.08)} className="text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[0.9] tracking-[-0.04em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {DOW_NAMES_LONG[s.peakDow]}
      </motion.div>
      <div className="grid gap-[14px] w-[min(720px,100%)] mt-6 max-md:gap-2"
        style={{ gridTemplateColumns: "repeat(7,1fr)" }}>
        {totals.map((v, d) => (
          <div key={d} className="flex flex-col items-center gap-1">
            <div className="w-full h-[180px] flex items-end max-md:h-[130px]">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: isCurrent ? 1 : 0 }}
                transition={{
                  duration: isCurrent ? 0.65 : 0.2,
                  delay: isCurrent ? d * 0.04 + 0.22 : 0,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="w-full rounded-t-xl min-h-1.5"
                style={{
                  height: `${((v / max) * 100).toFixed(2)}%`,
                  backgroundColor: palette.fg,
                  transformOrigin: "bottom",
                }}
              />
            </div>
            <div className="font-mono text-sm opacity-85 uppercase tracking-[0.1em]">
              {DOW_NAMES[d]}
            </div>
            <div className="font-mono text-xs opacity-60">{fmtNum(v)}</div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
