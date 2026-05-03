"use client";

import { SlideShell } from "@/components/story/SlideShell";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

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

  const tw = stats.topWords.slice(0, 24);
  const max = tw[0].count;

  return (
    <SlideShell label="words you wore out" palette={palette} isCurrent={isCurrent}>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        your most-used word was
      </div>
      <div
        className="text-[clamp(2.6rem,8vw,6rem)] font-black leading-none tracking-[-0.04em] break-words"
        style={{ color: palette.accent }}
      >
        {tw[0].word}
      </div>
      <div className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        you used it {fmtNum(tw[0].count)} times.
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 max-w-[900px] leading-[1.1]">
        {tw.map((w) => (
          <span
            key={w.word}
            className="font-extrabold opacity-92 cursor-default"
            style={{ fontSize: `${(0.8 + 1.6 * (w.count / max)).toFixed(2)}rem` }}
            title={`${fmtNum(w.count)}`}
          >
            {w.word}
          </span>
        ))}
      </div>
    </SlideShell>
  );
}
