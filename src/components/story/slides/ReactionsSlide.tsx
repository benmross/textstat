"use client";

import { SlideShell } from "@/components/story/SlideShell";
import { Pill } from "@/components/shared/Pill";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface ReactionsSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function ReactionsSlide({
  stats,
  palette,
  isCurrent,
}: ReactionsSlideProps) {
  const s = stats.summary;
  if (s.reactionsSent + s.reactionsRecv === 0) return null;

  const top = stats.topReactions[0];

  return (
    <SlideShell label="tapbacks" palette={palette} isCurrent={isCurrent}>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        on RCS, you collected
      </div>
      <div className="text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[0.9] tracking-[-0.04em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {fmtNum(s.reactionsSent + s.reactionsRecv)}
      </div>
      <div className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        reactions on each others&apos; messages.
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Pill>{fmtNum(s.reactionsSent)} sent</Pill>
        <Pill>{fmtNum(s.reactionsRecv)} received</Pill>
      </div>
      {top && (
        <div className="mt-5 flex flex-col items-center gap-1">
          <div className="text-[clamp(5rem,16vw,11rem)] leading-none drop-shadow-[0_12px_0_rgba(0,0,0,.1)]">
            {top.emoji}
          </div>
          <div className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
            your favorite reaction · used {fmtNum(top.count)} times
          </div>
        </div>
      )}
      {stats.topReactions.length > 1 && (
        <div className="grid gap-3 w-[min(900px,100%)] mt-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}>
          {stats.topReactions.slice(1, 7).map((e) => (
            <div
              key={e.emoji}
              className="flex flex-col items-center gap-1 rounded-[18px] border border-white/20 bg-black/15 p-2.5"
            >
              <div className="text-[2.6rem] leading-none">{e.emoji}</div>
              <div className="font-mono text-sm opacity-80">{fmtNum(e.count)}</div>
            </div>
          ))}
        </div>
      )}
    </SlideShell>
  );
}
