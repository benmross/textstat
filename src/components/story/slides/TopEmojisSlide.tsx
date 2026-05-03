"use client";

import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { AppleEmoji } from "@/components/shared/AppleEmoji";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";
import { contrastColor } from "@/lib/palettes";

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
  const sent = stats.topEmojisSent.slice(0, 6);
  const recv = stats.topEmojisRecv.slice(0, 6);

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  const Emoji = ({ emoji, className, style }: { emoji: string; className?: string; style?: React.CSSProperties }) =>
    isImsg
      ? <AppleEmoji emoji={emoji} className={className} style={style} />
      : <span className={className} style={{ fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif", ...style }}>{emoji}</span>;

  const fgContrast = contrastColor(palette.fg);

  return (
    <SlideShell label="the emojis" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        your most-used emojis
      </motion.div>

      {/* Two-column hero */}
      <div className="grid grid-cols-2 gap-4 w-[min(700px,100%)] mt-2">
        {[
          { label: "you", list: sent },
          { label: "them", list: recv },
        ].map(({ label, list }, col) => (
          <motion.div
            key={label}
            initial={{ scale: 0, opacity: 0 }}
            animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: isCurrent ? 0.08 + col * 0.08 : 0 }}
            className="flex flex-col items-center gap-2 rounded-[22px] bg-black/20 border border-white/15 py-5 px-4"
          >
            <div
              className="text-[0.7rem] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full"
              style={{ backgroundColor: palette.fg, color: fgContrast }}
            >
              {label}
            </div>
            {list[0] ? (
              <>
                <div className="text-[clamp(3.5rem,10vw,6.5rem)] leading-none">
                  <Emoji emoji={list[0].emoji} />
                </div>
                <div className="text-[clamp(0.85rem,1.4vw,1.1rem)] opacity-75 font-medium">
                  {fmtNum(list[0].count)}×
                </div>
              </>
            ) : (
              <div className="opacity-40 text-sm">—</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Two-column emoji grids — exactly 4 per side, fixed 4-col row */}
      <div className="grid grid-cols-2 gap-4 w-[min(700px,100%)] mt-2">
        {[
          { label: "you", list: sent.slice(1, 5) },
          { label: "them", list: recv.slice(1, 5) },
        ].map(({ label, list }, col) => (
          <div key={label} className="grid grid-cols-4 gap-2">
            {list.map((e, i) => (
              <motion.div
                key={e.emoji}
                initial={{ scale: 0, opacity: 0 }}
                animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 20, delay: isCurrent ? 0.3 + col * 0.06 + i * 0.04 : 0 }}
                className="flex flex-col items-center gap-1 rounded-[14px] border border-white/15 bg-black/15 p-3"
              >
                <div className="text-[2rem] leading-none">
                  <Emoji emoji={e.emoji} />
                </div>
                <div className="font-mono text-xs opacity-70">{fmtNum(e.count)}</div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
