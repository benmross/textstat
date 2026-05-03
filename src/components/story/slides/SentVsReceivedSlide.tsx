"use client";

import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { Pill } from "@/components/shared/Pill";
import { Palette, contrastColor } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface SentVsReceivedSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function SentVsReceivedSlide({
  stats,
  palette,
  isCurrent,
}: SentVsReceivedSlideProps) {
  const s = stats.summary;
  const sentPct = s.totalMessages
    ? (100 * s.totalSent) / s.totalMessages
    : 0;
  let vibe = "a balanced texter.";
  if (sentPct > 55) vibe = "a double-texter, no shame.";
  else if (sentPct < 45) vibe = "mostly listening — the receiver.";

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="sent vs received" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        you are
      </motion.div>
      <motion.div {...fu(0.08)} className="text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[0.9] tracking-[-0.04em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {vibe}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={isCurrent ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
        transition={{ duration: isCurrent ? 0.7 : 0.2, delay: isCurrent ? 0.22 : 0, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ transformOrigin: "left" }}
        className="w-[min(680px,100%)] mt-4"
      >
        <div className="flex h-[88px] rounded-[22px] overflow-hidden border-2 border-black/15">
          <div
            className="flex flex-col items-center justify-center min-w-0 px-3 py-1 font-mono text-sm"
            style={{
              flex: s.totalSent,
              backgroundColor: palette.fg,
              color: contrastColor(palette.fg),
            }}
          >
            <span className="text-xs uppercase tracking-[0.15em] opacity-70">
              sent
            </span>
            <span className="text-[clamp(1.2rem,2.4vw,1.8rem)] font-extrabold">
              {fmtNum(s.totalSent)}
            </span>
          </div>
          <div
            className="flex flex-col items-center justify-center min-w-0 px-3 py-1 font-mono text-sm"
            style={{
              flex: s.totalRecv,
              backgroundColor: "rgba(0,0,0,.25)",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            <span className="text-xs uppercase tracking-[0.15em] opacity-70">
              received
            </span>
            <span className="text-[clamp(1.2rem,2.4vw,1.8rem)] font-extrabold">
              {fmtNum(s.totalRecv)}
            </span>
          </div>
        </div>
      </motion.div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {[
          { text: `${fmtNum(s.charsSent)} characters sent`, alt: false },
          { text: `${fmtNum(s.charsRecv)} characters received`, alt: true },
        ].map(({ text, alt }, i) => (
          <motion.div
            key={text}
            initial={{ scale: 0, opacity: 0 }}
            animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: isCurrent ? 0.62 + i * 0.07 : 0 }}
          >
            <Pill alt={alt}>{text}</Pill>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
