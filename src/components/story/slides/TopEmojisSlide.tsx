"use client";

import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { AppleEmoji } from "@/components/shared/AppleEmoji";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface TopEmojisSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function TopEmojisSlide({
  stats,
  palette,
  isCurrent,
}: TopEmojisSlideProps) {
  if (!stats.topEmojis.length) return null;

  const isImsg = !!stats.summary.serviceCounts;
  const te = stats.topEmojis.slice(0, 12);

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  const Emoji = ({ emoji, className, style }: { emoji: string; className?: string; style?: React.CSSProperties }) =>
    isImsg
      ? <AppleEmoji emoji={emoji} className={className} style={style} />
      : <span className={className} style={{ fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif", ...style }}>{emoji}</span>;

  return (
    <SlideShell label="the emojis" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        your signature emoji
      </motion.div>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 14, delay: isCurrent ? 0.1 : 0 }}
        className="text-[clamp(5rem,16vw,11rem)] leading-none drop-shadow-[0_12px_0_rgba(0,0,0,.1)]"
      >
        <Emoji emoji={te[0].emoji} />
      </motion.div>
      <motion.div {...fu(0.32)} className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        appearing {fmtNum(te[0].count)} times.
      </motion.div>
      <div className="grid gap-3 w-[min(900px,100%)] mt-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}>
        {te.map((e, i) => (
          <motion.div
            key={e.emoji}
            initial={{ scale: 0, opacity: 0 }}
            animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 20, delay: isCurrent ? 0.42 + i * 0.045 : 0 }}
            className="flex flex-col items-center gap-1 rounded-[18px] border border-white/20 bg-black/15 p-4"
          >
            <div className="text-[2.6rem] leading-none">
              <Emoji emoji={e.emoji} />
            </div>
            <div className="font-mono text-sm opacity-80">{fmtNum(e.count)}</div>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
