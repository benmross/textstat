"use client";

import { motion } from "framer-motion";
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
  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="always on" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        over those
      </motion.div>
      <motion.div {...fu(0.08)} className="text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[0.9] tracking-[-0.04em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {fmtNum(s.totalDays)} days
      </motion.div>
      <motion.div {...fu(0.16)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        you sent or received a message on
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={isCurrent ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.55, delay: isCurrent ? 0.26 : 0, ease: "easeOut" }}
        className="text-[clamp(4.5rem,14vw,11rem)] font-black leading-[0.9] tracking-[-0.06em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]"
      >
        {fmtNum(s.activeDays)}
      </motion.div>
      <motion.div {...fu(0.38)} className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        of them — that&apos;s {activePct}% of your days.
      </motion.div>
      {s.busiest && s.busiest.ymd && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {[
            { text: `busiest day: ${fmtYmd(s.busiest.ymd)}`, alt: false },
            { text: `${fmtNum(s.busiest.count)} messages that day`, alt: true },
          ].map(({ text, alt }, i) => (
            <motion.div
              key={text}
              initial={{ scale: 0, opacity: 0 }}
              animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: isCurrent ? 0.5 + i * 0.07 : 0 }}
            >
              <Pill alt={alt}>{text}</Pill>
            </motion.div>
          ))}
        </div>
      )}
    </SlideShell>
  );
}
