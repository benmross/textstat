"use client";

import { motion } from "framer-motion";

interface LoadingScreenProps {
  progress: number;
  statusMsg: string;
}

const TIPS = [
  "reading XML at near disk speed…",
  "only your browser sees this — nothing uploaded.",
  'counting every "lol" you ever typed…',
  "building your monthly chart…",
  "the more texts, the better the wrap.",
  "sniffing out RCS reactions…",
  "tallying late-night double-texts…",
];

export function LoadingScreen({
  progress,
  statusMsg,
}: LoadingScreenProps) {
  const pct = Math.max(0, Math.min(100, progress)).toFixed(1);
  const tipIndex = Math.floor(progress / 14) % TIPS.length;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[radial-gradient(1200px_700px_at_50%_0%,rgba(108,37,196,.45),transparent_60%),radial-gradient(800px_500px_at_50%_100%,rgba(255,46,99,.35),transparent_60%),#100023]">
      <div className="w-[min(560px,90vw)] text-center">
        <div
          className="mx-auto mb-7 h-[88px] w-[88px] animate-spin rounded-full bg-[conic-gradient(from_0deg,#ff2e63,#ffd60a,#aef639,#00d6ff,#6c25c4,#ff2e63)]"
          style={{
            mask: "radial-gradient(circle 30px at 50% 50%, transparent 98%, black 100%)",
            WebkitMask:
              "radial-gradient(circle 30px at 50% 50%, transparent 98%, black 100%)",
          }}
        />

        <h2 className="mb-6 text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-[-0.02em]">
          cooking your wrapped…
        </h2>

        <div className="flex flex-col gap-2">
          <div className="h-[14px] w-full overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#ff2e63] via-[#ffd60a] to-[#aef639] shadow-[0_0_22px_rgba(255,214,10,.4)]"
              style={{ width: `${pct}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>
          <div className="flex justify-between font-mono text-[0.85rem] text-white/80">
            <span>{pct}%</span>
            <span>{statusMsg}</span>
          </div>
        </div>

        <ul className="mt-8 min-h-[1.4em] list-none p-0 text-[0.95rem] text-white/55">
          <li>{TIPS[tipIndex]}</li>
        </ul>
      </div>
    </div>
  );
}
