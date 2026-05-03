"use client";

import { SlideShell } from "@/components/story/SlideShell";
import { Pill } from "@/components/shared/Pill";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum, fmtDateShort } from "@/lib/formatting";

interface HeroSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function HeroSlide({ stats, palette, isCurrent }: HeroSlideProps) {
  const s = stats.summary;
  return (
    <SlideShell label="your year in messages" palette={palette} isCurrent={isCurrent}>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        a tiny wrap of every text in
      </div>
      <div className="font-mono text-[clamp(.9rem,1.3vw,1.1rem)] opacity-75">
        {fmtDateShort(s.firstTs)} → {fmtDateShort(s.lastTs)}
      </div>
      <div className="text-[clamp(4.5rem,14vw,11rem)] font-black leading-[0.9] tracking-[-0.06em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {fmtNum(s.totalMessages)}
      </div>
      <div className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        messages on your phone.
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Pill>{fmtNum(s.totalSent)} sent</Pill>
        <Pill>{fmtNum(s.totalRecv)} received</Pill>
        <Pill alt>{s.avgPerDay}/day average</Pill>
      </div>
      <div className="mt-6 text-xs uppercase tracking-[0.15em] opacity-55">
        → tap or arrow keys
      </div>
    </SlideShell>
  );
}
