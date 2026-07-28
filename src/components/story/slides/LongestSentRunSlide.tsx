"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { Avatar } from "@/components/shared/Avatar";
import { Palette, contrastColor } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface Props {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function LongestSentRunSlide({ stats, palette, isCurrent }: Props) {
  const run = stats.summary.longestSentRun;
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolled = useRef(false);

  // Wait for the entrance animation, then auto-scroll. Refs track user intent
  // without adding a render-only "ready" state.
  useEffect(() => {
    userScrolled.current = false;
    const el = scrollRef.current;
    let raf: number;

    const timer = window.setTimeout(() => {
      if (!isCurrent || !el || userScrolled.current) return;
      const dist = el.scrollHeight - el.clientHeight;
      if (dist <= 0) return;

      const duration = Math.min(dist * 5, 8000);
      const start = performance.now();
      const startTop = el.scrollTop;

      function step(now: number) {
        if (!el || userScrolled.current) return;
        const t = Math.min((now - start) / duration, 1);
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        el.scrollTop = startTop + dist * ease;
        if (t < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }, 600);

    return () => {
      window.clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isCurrent]);

  // detect user-initiated scroll intent (wheel / touch) — NOT fired by programmatic scrollTop changes
  function onUserScrollIntent() {
    userScrolled.current = true;
  }

  if (!run) return null;

  const label =
    run.count >= 10
      ? "you really needed to talk"
      : run.count >= 5
      ? "they left you on read"
      : "waiting on a reply";

  const bubbleText = contrastColor(palette.fg);

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="unanswered streak" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        {label}
      </motion.div>

      <div className="flex items-center gap-3 mt-1">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: isCurrent ? 0.1 : 0 }}
        >
          <Avatar entry={{ displayName: run.displayName, photo: run.photo }} size="md" />
        </motion.div>
        <div className="min-w-0">
          <motion.div {...fu(0.15)} className="text-[clamp(1.4rem,3.5vw,2.4rem)] font-black leading-none tracking-[-0.03em] truncate">
            {run.displayName}
          </motion.div>
          <motion.div {...fu(0.22)} className="text-[0.8rem] uppercase tracking-[0.12em] opacity-60 mt-0.5">
            {fmtNum(run.count)} messages, no reply
          </motion.div>
        </div>
      </div>

      {run.messages.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isCurrent ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4, delay: isCurrent ? 0.32 : 0 }}
          ref={scrollRef}
          onWheel={onUserScrollIntent}
          onTouchStart={onUserScrollIntent}
          className="w-[min(600px,100%)] mt-3 overflow-y-auto max-h-[clamp(180px,28vh,320px)] flex flex-col gap-2 pr-1
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-black/10
            [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/30"
        >
          {run.messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={isCurrent ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{ duration: 0.35, delay: isCurrent ? 0.38 + i * 0.045 : 0, ease: "easeOut" }}
              className="self-end max-w-[85%] rounded-[18px] rounded-br-[5px] px-4 py-2 text-sm leading-snug break-words text-left"
              style={{ backgroundColor: palette.fg, color: bubbleText }}
            >
              {msg || <span className="opacity-40 italic">attachment</span>}
            </motion.div>
          ))}
          {run.count > run.messages.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={isCurrent ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.3, delay: isCurrent ? 0.38 + run.messages.length * 0.045 : 0 }}
              className="self-end text-xs opacity-50 pr-1"
            >
              +{fmtNum(run.count - run.messages.length)} more
            </motion.div>
          )}
        </motion.div>
      )}
    </SlideShell>
  );
}
