"use client";

import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { Avatar } from "@/components/shared/Avatar";
import { Palette } from "@/lib/palettes";
import { TextStatStats, LongestBody } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";
import { contrastColor } from "@/lib/palettes";

interface LongestMessageSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

function MessageCard({
  lb,
  label,
  palette,
  isCurrent,
  delay,
}: {
  lb: LongestBody;
  label: string;
  palette: Palette;
  isCurrent: boolean;
  delay: number;
}) {
  const fgContrast = contrastColor(palette.fg);
  const bylineEntry = { name: lb.contact, photo: lb.photo };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" }}
      className="flex flex-col gap-3 rounded-[22px] bg-black/20 border border-white/15 p-5 text-left"
    >
      {/* label pill + char count */}
      <div className="flex items-center justify-between gap-3">
        <div
          className="text-[0.65rem] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full shrink-0"
          style={{ backgroundColor: palette.fg, color: fgContrast }}
        >
          {label}
        </div>
        <div className="text-xs opacity-60 font-mono">{fmtNum(lb.len)} chars</div>
      </div>

      {/* byline */}
      <div className="inline-flex items-center gap-3 rounded-full bg-black/20 pl-[0.45rem] pr-4 py-[0.45rem] self-start">
        <Avatar entry={bylineEntry} size="sm" />
        <div className="flex flex-col gap-0 leading-[1.1]">
          <div className="text-[0.6rem] uppercase tracking-[0.14em] opacity-60">
            {lb.sent ? "you wrote" : "from"}
          </div>
          <div className="text-[clamp(0.85rem,1.4vw,1rem)] font-extrabold">{lb.contact}</div>
        </div>
      </div>

      {/* quote */}
      <blockquote
        className="text-[clamp(0.82rem,1.3vw,1rem)] leading-[1.55] opacity-90 border-l-4 pl-4"
        style={{ borderColor: palette.accent }}
      >
        &ldquo;{lb.preview}&rdquo;
      </blockquote>
    </motion.div>
  );
}

export function LongestMessageSlide({
  stats,
  palette,
  isCurrent,
}: LongestMessageSlideProps) {
  const s = stats.summary;
  const sentBody = s.longestSentBody;
  const recvBody = s.longestRecvBody;

  const hasSent = sentBody && sentBody.len > 100;
  const hasRecv = recvBody && recvBody.len > 100;
  if (!hasSent && !hasRecv) return null;

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  const bothVisible = hasSent && hasRecv;

  return (
    <SlideShell label="longest messages" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        {bothVisible ? "your longest vs. theirs" : hasSent ? "your longest message" : "the longest message you received"}
      </motion.div>

      <div className={`grid gap-4 w-[min(860px,100%)] mt-2 ${bothVisible ? "grid-cols-2" : "grid-cols-1 max-w-[520px]"}`}>
        {hasSent && (
          <MessageCard
            lb={sentBody!}
            label="you"
            palette={palette}
            isCurrent={isCurrent}
            delay={0.14}
          />
        )}
        {hasRecv && (
          <MessageCard
            lb={recvBody!}
            label="them"
            palette={palette}
            isCurrent={isCurrent}
            delay={bothVisible ? 0.22 : 0.14}
          />
        )}
      </div>
    </SlideShell>
  );
}
