"use client";

import { motion } from "framer-motion";
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

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  const statCards = [
    { label: "sent", value: fmtNum(s.totalSent) },
    { label: "received", value: fmtNum(s.totalRecv) },
    { label: isImsg ? "attachments" : "rcs", value: fmtNum(isImsg ? (s.attachmentCount || 0) : s.rcsCount) },
    { label: "groups", value: fmtNum(s.uniqueGroups) },
  ];

  return (
    <SlideShell label="that's a wrap" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        you texted
      </motion.div>
      <motion.div {...fu(0.08)} className="text-[clamp(4.5rem,14vw,11rem)] font-black leading-[0.9] tracking-[-0.06em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]">
        {fmtNum(s.totalMessages)}
      </motion.div>
      <motion.div {...fu(0.16)} className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        times across {s.uniqueContacts} contacts.
      </motion.div>
      {finalFaces.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-[0.45rem] max-w-[560px]">
          {finalFaces.map((c, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 20, delay: isCurrent ? 0.28 + i * 0.045 : 0 }}
            >
              <Avatar
                entry={c}
                size="md"
                className="!shadow-[0_6px_18px_-6px_rgba(0,0,0,.5),inset_0_0_0_3px_rgba(255,255,255,.3)]"
              />
            </motion.div>
          ))}
        </div>
      )}
      <div className="mt-6 grid grid-cols-4 gap-3 w-[min(640px,100%)] max-md:grid-cols-2">
        {statCards.map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ scale: 0, opacity: 0 }}
            animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 22, delay: isCurrent ? 0.75 + i * 0.07 : 0 }}
            className="flex flex-col items-center gap-1 rounded-2xl border border-white/15 bg-black/20 p-4"
          >
            <span className="text-[0.7rem] uppercase tracking-[0.15em] opacity-65">
              {label}
            </span>
            <span className="text-[clamp(1.3rem,2.2vw,1.7rem)] font-extrabold">
              {value}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.div {...fu(1.1)} className="mt-8 text-xs uppercase tracking-[0.15em] opacity-55">
        ↺ start over to load another export
      </motion.div>
    </SlideShell>
  );
}
