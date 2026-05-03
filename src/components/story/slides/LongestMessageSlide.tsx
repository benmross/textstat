"use client";

import { SlideShell } from "@/components/story/SlideShell";
import { Avatar } from "@/components/shared/Avatar";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface LongestMessageSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function LongestMessageSlide({
  stats,
  palette,
  isCurrent,
}: LongestMessageSlideProps) {
  const s = stats.summary;
  const lb = s.longestBody;
  if (!lb || lb.len <= 100) return null;

  const bylineEntry = { name: lb.contact, photo: lb.photo };

  return (
    <SlideShell label="your magnum opus" palette={palette} isCurrent={isCurrent}>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        your longest single message — {fmtNum(lb.len)} characters
      </div>
      <div className="mt-2 inline-flex items-center gap-4 rounded-full bg-black/20 pl-[0.55rem] pr-4 py-[0.55rem]">
        <Avatar entry={bylineEntry} size="md" />
        <div className="flex flex-col items-start gap-0 leading-[1.1] text-left">
          <div className="text-xs uppercase tracking-[0.15em] opacity-65">
            {lb.sent ? "you sent it to" : "from"}
          </div>
          <div className="text-[clamp(1rem,1.6vw,1.2rem)] font-extrabold">
            {lb.contact}
          </div>
        </div>
      </div>
      <blockquote
        className="mt-6 max-w-[720px] rounded-[18px] bg-black/20 px-6 py-5 text-left text-[clamp(1rem,1.6vw,1.25rem)] leading-[1.5] border-l-4"
        style={{ borderColor: palette.accent }}
      >
        &ldquo;{lb.preview}&rdquo;
      </blockquote>
    </SlideShell>
  );
}
