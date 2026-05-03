"use client";

import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { Pill } from "@/components/shared/Pill";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum, fmtDateShort } from "@/lib/formatting";

interface HeroSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function HeroSlide({ stats, palette, isCurrent }: HeroSlideProps) {
  const s = stats.summary;
  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });
  return (
    <SlideShell label="your year in messages" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        a tiny wrap of every text in
      </motion.div>
      <motion.div {...fu(0.08)} className="font-mono text-[clamp(.9rem,1.3vw,1.1rem)] opacity-75">
        {fmtDateShort(s.firstTs)} → {fmtDateShort(s.lastTs)}
      </motion.div>
      <motion.div {...fu(0.16)} className="text-[clamp(4.5rem,14vw,11rem)] font-black leading-[0.9] tracking-[-0.06em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {fmtNum(s.totalMessages)}
      </motion.div>
      <motion.div {...fu(0.24)} className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        messages on your phone.
      </motion.div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {[
          { text: `${fmtNum(s.totalSent)} sent`, alt: false },
          { text: `${fmtNum(s.totalRecv)} received`, alt: false },
          { text: `${s.avgPerDay}/day average`, alt: true },
        ].map(({ text, alt }, i) => (
          <motion.div
            key={text}
            initial={{ scale: 0, opacity: 0 }}
            animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: isCurrent ? 0.34 + i * 0.07 : 0 }}
          >
            <Pill alt={alt}>{text}</Pill>
          </motion.div>
        ))}
      </div>
      <motion.div {...fu(0.6)} className="mt-6 text-xs uppercase tracking-[0.15em] opacity-55">
        → tap or arrow keys
      </motion.div>
    </SlideShell>
  );
}
