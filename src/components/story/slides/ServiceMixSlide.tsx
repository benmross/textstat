"use client";

import { SlideShell } from "@/components/story/SlideShell";
import { Pill } from "@/components/shared/Pill";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface ServiceMixSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function ServiceMixSlide({
  stats,
  palette,
  isCurrent,
}: ServiceMixSlideProps) {
  const s = stats.summary;
  if (!s.serviceCounts) return null;

  const entries = Object.entries(s.serviceCounts).sort(
    (a, b) => b[1] - a[1]
  );
  const total = entries.reduce((a, [, v]) => a + v, 0);
  const top = entries[0];

  return (
    <SlideShell label="service mix" palette={palette} isCurrent={isCurrent}>
      <div className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        most of your messages went over
      </div>
      <div
        className="text-[clamp(2.6rem,8vw,6rem)] font-black leading-none tracking-[-0.04em] break-words"
        style={{ color: palette.accent }}
      >
        {top[0]}
      </div>
      <div className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        {fmtNum(top[1])} of {fmtNum(total)} (
        {((100 * top[1]) / total).toFixed(1)}%)
      </div>
      {entries.length > 1 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {entries.map(([svc, n]) => (
            <Pill key={svc}>
              {svc} · {fmtNum(n)}
            </Pill>
          ))}
        </div>
      )}
      {(s.attachmentCount || s.editedCount) ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {s.attachmentCount ? (
            <Pill alt>{fmtNum(s.attachmentCount)} attachments</Pill>
          ) : null}
          {s.editedCount ? (
            <Pill alt>{fmtNum(s.editedCount)} edits</Pill>
          ) : null}
        </div>
      ) : null}
    </SlideShell>
  );
}
