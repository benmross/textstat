"use client";

import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { Avatar } from "@/components/shared/Avatar";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface TopContactsListSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function TopContactsListSlide({
  stats,
  palette,
  isCurrent,
}: TopContactsListSlideProps) {
  if (stats.topContacts.length <= 1) return null;

  const top = stats.topContacts.slice(0, 8);
  const max = top[0].total;

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="your top contacts" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        the people in your inbox
      </motion.div>
      <motion.div {...fu(0.08)} className="text-[clamp(1.2rem,2vw,1.6rem)] font-bold opacity-90">
        top 8
      </motion.div>
      <div className="flex flex-col gap-[0.55rem] w-[min(680px,100%)] mt-4">
        {top.map((c, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -28 }}
            animate={isCurrent ? { opacity: 1, x: 0 } : { opacity: 0, x: -28 }}
            transition={{ duration: 0.45, delay: isCurrent ? idx * 0.055 + 0.18 : 0, ease: "easeOut" }}
            className="grid items-center gap-[0.6rem]"
            style={{
              gridTemplateColumns: "28px 36px 1.2fr 2fr auto",
            }}
          >
            <div className="font-mono text-sm opacity-55">#{idx + 1}</div>
            <Avatar entry={c} size="sm" />
            <div className="font-bold text-left whitespace-nowrap overflow-hidden text-ellipsis">
              {c.displayName}
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-black/15">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isCurrent ? 1 : 0 }}
                transition={{
                  duration: isCurrent ? 0.65 : 0.15,
                  delay: isCurrent ? idx * 0.055 + 0.32 : 0,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="h-full rounded-full"
                style={{
                  width: `${((c.total / max) * 100).toFixed(2)}%`,
                  backgroundColor: palette.fg,
                  transformOrigin: "left",
                }}
              />
            </div>
            <div className="font-mono text-sm min-w-[50px] text-right">
              {fmtNum(c.total)}
            </div>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
