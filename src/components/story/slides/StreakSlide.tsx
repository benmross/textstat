"use client";

import { motion } from "framer-motion";
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

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="your texting streak" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        you sent messages every day for
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={isCurrent ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.75 }}
        transition={{ type: "spring", stiffness: 320, damping: 22, delay: isCurrent ? 0.1 : 0 }}
        className="text-[clamp(4.5rem,14vw,11rem)] font-black leading-[0.9] tracking-[-0.06em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]"
      >
        {fmtNum(s.longestStreak)}
      </motion.div>
      <motion.div {...fu(0.28)} className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        days straight.
      </motion.div>
      {s.streakStart && s.streakEnd && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: isCurrent ? 0.4 : 0 }}
          className="mt-3 flex flex-wrap justify-center gap-2"
        >
          <Pill>
            {fmtDateShort(Date.parse(s.streakStart))} →{" "}
            {fmtDateShort(Date.parse(s.streakEnd))}
          </Pill>
        </motion.div>
      )}
    </SlideShell>
  );
}
