"use client";

import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";
import { contrastColor } from "@/lib/palettes";

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

  const sentTop = stats.topWordsSent[0];
  const recvTop = stats.topWordsRecv[0];
  const cloud = stats.topWords.slice(0, 24);
  const cloudMax = cloud[0]?.count || 1;
  const fgContrast = contrastColor(palette.fg);

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="words on repeat" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        your most-used words
      </motion.div>

      {/* Two-column hero words */}
      <div className="grid grid-cols-2 gap-4 w-[min(700px,100%)] mt-2">
        {[
          { label: "you", entry: sentTop },
          { label: "them", entry: recvTop },
        ].map(({ label, entry }, col) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: isCurrent ? 0.08 + col * 0.08 : 0, ease: "easeOut" }}
            className="flex flex-col items-center gap-2 rounded-[22px] bg-black/20 border border-white/15 py-5 px-4"
          >
            <div
              className="text-[0.7rem] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full"
              style={{ backgroundColor: palette.fg, color: fgContrast }}
            >
              {label}
            </div>
            {entry ? (
              <>
                <div
                  className="text-[clamp(1.6rem,5vw,3.2rem)] font-black leading-none tracking-[-0.03em] break-words text-center"
                  style={{ color: palette.accent }}
                >
                  {entry.word}
                </div>
                <div className="text-[clamp(0.85rem,1.4vw,1.05rem)] opacity-75">
                  {fmtNum(entry.count)} times
                </div>
              </>
            ) : (
              <div className="opacity-40 text-sm">—</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Combined word cloud */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 max-w-[900px] leading-[1.1]">
        {cloud.map((w, i) => (
          <motion.span
            key={w.word}
            initial={{ opacity: 0 }}
            animate={{ opacity: isCurrent ? 1 : 0 }}
            transition={{ duration: 0.35, delay: isCurrent ? 0.28 + i * 0.025 : 0 }}
            className="font-extrabold opacity-90 cursor-default"
            style={{ fontSize: `${(0.75 + 1.4 * (w.count / cloudMax)).toFixed(2)}rem` }}
            title={`${fmtNum(w.count)}`}
          >
            {w.word}
          </motion.span>
        ))}
      </div>
    </SlideShell>
  );
}
