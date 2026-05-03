"use client";

import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface TopWordsSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function TopWordsSlide({
  stats,
  palette,
  isCurrent,
}: TopWordsSlideProps) {
  if (!stats.topWords.length) return null;

  const tw = stats.topWords.slice(0, 24);
  const max = tw[0].count;

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="words you wore out" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        your most-used word was
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={isCurrent ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 10 }}
        transition={{ duration: 0.55, delay: isCurrent ? 0.1 : 0, ease: "easeOut" }}
        className="text-[clamp(2.6rem,8vw,6rem)] font-black leading-none tracking-[-0.04em] break-words"
        style={{ color: palette.accent }}
      >
        {tw[0].word}
      </motion.div>
      <motion.div {...fu(0.22)} className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        you used it {fmtNum(tw[0].count)} times.
      </motion.div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 max-w-[900px] leading-[1.1]">
        {tw.map((w, i) => (
          <motion.span
            key={w.word}
            initial={{ opacity: 0 }}
            animate={{ opacity: isCurrent ? 1 : 0 }}
            transition={{ duration: 0.35, delay: isCurrent ? 0.32 + i * 0.03 : 0 }}
            className="font-extrabold opacity-92 cursor-default"
            style={{ fontSize: `${(0.8 + 1.6 * (w.count / max)).toFixed(2)}rem` }}
            title={`${fmtNum(w.count)}`}
          >
            {w.word}
          </motion.span>
        ))}
      </div>
    </SlideShell>
  );
}
