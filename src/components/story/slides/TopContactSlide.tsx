"use client";

import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { Pill } from "@/components/shared/Pill";
import { Avatar } from "@/components/shared/Avatar";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface TopContactSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function TopContactSlide({ stats, palette, isCurrent }: TopContactSlideProps) {
  const top1 = stats.topContacts[0];
  if (!top1) return null;

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="your #1" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        no one else came close.
      </motion.div>
      <motion.div {...fu(0.08)} className="text-[0.85rem] uppercase tracking-[0.15em] opacity-65">
        most messaged contact
      </motion.div>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 18, delay: isCurrent ? 0.18 : 0 }}
        className="my-1 flex justify-center"
      >
        <Avatar entry={top1} size="xl" />
      </motion.div>
      <motion.div {...fu(0.36)} className="text-[clamp(2.6rem,8vw,6rem)] font-black leading-none tracking-[-0.04em] break-words">
        {top1.displayName}
      </motion.div>
      <motion.div {...fu(0.44)} className="text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[0.9] tracking-[-0.04em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {fmtNum(top1.total)} messages
      </motion.div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {[
          `${fmtNum(top1.sent)} sent → them`,
          `${fmtNum(top1.recv)} from them →`,
        ].map((text, i) => (
          <motion.div
            key={text}
            initial={{ scale: 0, opacity: 0 }}
            animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: isCurrent ? 0.54 + i * 0.07 : 0 }}
          >
            <Pill>{text}</Pill>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
