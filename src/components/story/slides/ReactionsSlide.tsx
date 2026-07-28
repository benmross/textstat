"use client";

import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { Pill } from "@/components/shared/Pill";
import { AppleEmoji } from "@/components/shared/AppleEmoji";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface ReactionsSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

function ReactionEmoji({
  emoji,
  className,
  useApple,
}: {
  emoji: string;
  className?: string;
  useApple: boolean;
}) {
  return useApple
    ? <AppleEmoji emoji={emoji} className={className} />
    : <span className={className} style={{ fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif" }}>{emoji}</span>;
}

export function ReactionsSlide({
  stats,
  palette,
  isCurrent,
}: ReactionsSlideProps) {
  const s = stats.summary;
  if (s.reactionsSent + s.reactionsRecv === 0) return null;

  const isImsg = !!s.serviceCounts;
  const top = stats.topReactions[0];

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="tapbacks" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        between you, you left
      </motion.div>
      <motion.div {...fu(0.08)} className="text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[0.9] tracking-[-0.04em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {fmtNum(s.reactionsSent + s.reactionsRecv)}
      </motion.div>
      <motion.div {...fu(0.16)} className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        reactions on each others&apos; messages.
      </motion.div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {[
          { text: `${fmtNum(s.reactionsSent)} sent`, alt: false },
          { text: `${fmtNum(s.reactionsRecv)} received`, alt: false },
        ].map(({ text, alt }, i) => (
          <motion.div
            key={text}
            initial={{ scale: 0, opacity: 0 }}
            animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: isCurrent ? 0.26 + i * 0.07 : 0 }}
          >
            <Pill alt={alt}>{text}</Pill>
          </motion.div>
        ))}
      </div>
      {top && (
        <div className="mt-5 flex flex-col items-center gap-1">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 16, delay: isCurrent ? 0.42 : 0 }}
            className="text-[clamp(5rem,16vw,11rem)] leading-none drop-shadow-[0_12px_0_rgba(0,0,0,.1)]"
          >
            <ReactionEmoji emoji={top.emoji} useApple={isImsg} />
          </motion.div>
          <motion.div {...fu(0.58)} className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
            your favorite reaction · used {fmtNum(top.count)} times
          </motion.div>
        </div>
      )}
      {stats.topReactions.length > 1 && (
        <div className="grid gap-3 w-[min(900px,100%)] mt-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}>
          {stats.topReactions.slice(1, 7).map((e, i) => (
            <motion.div
              key={e.emoji}
              initial={{ scale: 0, opacity: 0 }}
              animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 20, delay: isCurrent ? 0.65 + i * 0.06 : 0 }}
              className="flex flex-col items-center gap-1 rounded-[18px] border border-white/20 bg-black/15 p-2.5"
            >
              <div className="text-[2.6rem] leading-none">
                <ReactionEmoji emoji={e.emoji} useApple={isImsg} />
              </div>
              <div className="font-mono text-sm opacity-80">{fmtNum(e.count)}</div>
            </motion.div>
          ))}
        </div>
      )}
    </SlideShell>
  );
}
