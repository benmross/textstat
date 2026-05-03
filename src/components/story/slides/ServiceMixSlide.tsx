"use client";

import { motion } from "framer-motion";
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

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="service mix" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        most of your messages went over
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 12 }}
        animate={isCurrent ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 12 }}
        transition={{ duration: 0.55, delay: isCurrent ? 0.1 : 0, ease: "easeOut" }}
        className="text-[clamp(2.6rem,8vw,6rem)] font-black leading-none tracking-[-0.04em] break-words"
        style={{ color: palette.accent }}
      >
        {top[0]}
      </motion.div>
      <motion.div {...fu(0.24)} className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        {fmtNum(top[1])} of {fmtNum(total)} (
        {((100 * top[1]) / total).toFixed(1)}%)
      </motion.div>
      {entries.length > 1 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {entries.map(([svc, n], i) => (
            <motion.div
              key={svc}
              initial={{ scale: 0, opacity: 0 }}
              animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: isCurrent ? 0.36 + i * 0.07 : 0 }}
            >
              <Pill>{svc} · {fmtNum(n)}</Pill>
            </motion.div>
          ))}
        </div>
      )}
      {(s.attachmentCount || s.editedCount) ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {s.attachmentCount ? (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: isCurrent ? 0.52 : 0 }}
            >
              <Pill alt>{fmtNum(s.attachmentCount)} attachments</Pill>
            </motion.div>
          ) : null}
          {s.editedCount ? (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: isCurrent ? 0.6 : 0 }}
            >
              <Pill alt>{fmtNum(s.editedCount)} edits</Pill>
            </motion.div>
          ) : null}
        </div>
      ) : null}
    </SlideShell>
  );
}
