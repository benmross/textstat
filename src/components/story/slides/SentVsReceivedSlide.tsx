"use client";

import { SlideShell } from "@/components/story/SlideShell";
import { Pill } from "@/components/shared/Pill";
import { Palette } from "@/lib/palettes";
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

  return (
    <SlideShell label="sent vs received" palette={palette} isCurrent={isCurrent}>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        you are
      </div>
      <div className="text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[0.9] tracking-[-0.04em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {vibe}
      </div>
      <div className="w-[min(680px,100%)] mt-4">
        <div className="flex h-[88px] rounded-[22px] overflow-hidden border-2 border-black/15">
          <div
            className="flex flex-col items-center justify-center min-w-0 px-3 py-1 font-mono text-sm transition-all duration-1000"
            style={{
              flex: s.totalSent,
              backgroundColor: palette.fg,
              color: palette.accent,
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
            className="flex flex-col items-center justify-center min-w-0 px-3 py-1 font-mono text-sm transition-all duration-1000"
            style={{
              flex: s.totalRecv,
              backgroundColor: "rgba(0,0,0,.25)",
              color: palette.fg,
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
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Pill>{fmtNum(s.charsSent)} characters sent</Pill>
          <Pill alt>{fmtNum(s.charsRecv)} characters received</Pill>
        </div>
      </div>
    </SlideShell>
  );
}
