"use client";

import { SlideShell } from "@/components/story/SlideShell";
import { Avatar } from "@/components/shared/Avatar";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface WrapSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function WrapSlide({
  stats,
  palette,
  isCurrent,
}: WrapSlideProps) {
  const s = stats.summary;
  const isImsg = !!s.serviceCounts;
  const finalFaces = stats.topContacts.slice(0, 10);

  return (
    <SlideShell label="that's a wrap" palette={palette} isCurrent={isCurrent}>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        you texted
      </div>
      <div className="text-[clamp(4.5rem,14vw,11rem)] font-black leading-[0.9] tracking-[-0.06em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {fmtNum(s.totalMessages)}
      </div>
      <div className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        times across {s.uniqueContacts} contacts.
      </div>
      {finalFaces.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-[0.45rem] max-w-[560px]">
          {finalFaces.map((c, i) => (
            <Avatar
              key={i}
              entry={c}
              size="md"
              className="!shadow-[0_6px_18px_-6px_rgba(0,0,0,.5),inset_0_0_0_3px_rgba(255,255,255,.3)]"
            />
          ))}
        </div>
      )}
      <div className="mt-6 grid grid-cols-4 gap-3 w-[min(640px,100%)] max-md:grid-cols-2">
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/15 bg-black/20 p-4">
          <span className="text-[0.7rem] uppercase tracking-[0.15em] opacity-65">
            sent
          </span>
          <span className="text-[clamp(1.3rem,2.2vw,1.7rem)] font-extrabold">
            {fmtNum(s.totalSent)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/15 bg-black/20 p-4">
          <span className="text-[0.7rem] uppercase tracking-[0.15em] opacity-65">
            received
          </span>
          <span className="text-[clamp(1.3rem,2.2vw,1.7rem)] font-extrabold">
            {fmtNum(s.totalRecv)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/15 bg-black/20 p-4">
          <span className="text-[0.7rem] uppercase tracking-[0.15em] opacity-65">
            {isImsg ? "attachments" : "rcs"}
          </span>
          <span className="text-[clamp(1.3rem,2.2vw,1.7rem)] font-extrabold">
            {fmtNum(isImsg ? (s.attachmentCount || 0) : s.rcsCount)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/15 bg-black/20 p-4">
          <span className="text-[0.7rem] uppercase tracking-[0.15em] opacity-65">
            groups
          </span>
          <span className="text-[clamp(1.3rem,2.2vw,1.7rem)] font-extrabold">
            {fmtNum(s.uniqueGroups)}
          </span>
        </div>
      </div>
      <div className="mt-8 text-xs uppercase tracking-[0.15em] opacity-55">
        ↺ start over to load another export
      </div>
    </SlideShell>
  );
}
