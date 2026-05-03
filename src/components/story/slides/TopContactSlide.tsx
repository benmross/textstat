"use client";

import { SlideShell } from "@/components/story/SlideShell";
import { Pill } from "@/components/shared/Pill";
import { Avatar } from "@/components/shared/Avatar";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface TopContactSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function TopContactSlide({ stats, palette, isCurrent }: TopContactSlideProps) {
  const top1 = stats.topContacts[0];
  if (!top1) return null;

  return (
    <SlideShell label="your #1" palette={palette} isCurrent={isCurrent}>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        no one else came close.
      </div>
      <div className="text-[0.85rem] uppercase tracking-[0.15em] opacity-65">
        most messaged contact
      </div>
      <div className="my-1 flex justify-center">
        <Avatar entry={top1} size="xl" />
      </div>
      <div className="text-[clamp(2.6rem,8vw,6rem)] font-black leading-none tracking-[-0.04em] break-words bg-gradient-to-r from-current to-current bg-clip-text text-transparent">
        {top1.displayName}
      </div>
      <div className="text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[0.9] tracking-[-0.04em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {fmtNum(top1.total)} messages
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Pill>{fmtNum(top1.sent)} sent → them</Pill>
        <Pill>{fmtNum(top1.recv)} from them →</Pill>
      </div>
    </SlideShell>
  );
}
