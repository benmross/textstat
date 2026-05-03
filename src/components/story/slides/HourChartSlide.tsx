"use client";

import { motion } from "framer-motion";
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

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="when you text" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        your peak hour is
      </motion.div>
      <motion.div {...fu(0.08)} className="text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[0.9] tracking-[-0.04em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {fmtHour(s.peakHour)}
      </motion.div>
      <motion.div {...fu(0.16)} className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        {s.lateNightSentPct}% of your sent messages happen after 11 PM or before
        5 AM.
      </motion.div>
      <div className="grid gap-1 w-[min(900px,100%)] h-[220px] mt-5 items-end max-md:h-[160px]"
        style={{ gridTemplateColumns: "repeat(24,1fr)" }}>
        {totals.map((v, h) => (
          <div
            key={h}
            className="relative flex flex-col items-center h-full"
            title={`${fmtHour(h)} — ${fmtNum(v)} messages`}
          >
            <div className="w-full flex-1 flex items-end">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: isCurrent ? 1 : 0 }}
                transition={{
                  duration: isCurrent ? 0.55 : 0.15,
                  delay: isCurrent ? h * 0.012 + 0.28 : 0,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="w-full rounded-t-md min-h-0.5"
                style={{
                  height: `${((v / max) * 100).toFixed(2)}%`,
                  backgroundColor: palette.fg,
                  transformOrigin: "bottom",
                }}
              />
            </div>
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
