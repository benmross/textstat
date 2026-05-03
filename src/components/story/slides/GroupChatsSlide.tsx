"use client";

import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { Pill } from "@/components/shared/Pill";
import { AvatarStack } from "@/components/shared/Avatar";
import { Palette } from "@/lib/palettes";
import { TextStatStats } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

interface GroupChatsSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function GroupChatsSlide({
  stats,
  palette,
  isCurrent,
}: GroupChatsSlideProps) {
  const s = stats.summary;
  if (s.uniqueGroups === 0) return null;

  const groupTotal = stats.groups.reduce((a, g) => a + g.count, 0);
  const top = stats.groups[0];

  const participantEntries: Array<{ name: string; photo?: string | null }> = [];
  if (top) {
    const names = top.participantNames || [];
    const photos = top.participantPhotos || [];
    const participantCount = Math.max(names.length, top.participants || 0);
    for (let k = 0; k < participantCount; k++) {
      participantEntries.push({
        name: names[k] || "member " + (k + 1),
        photo: photos[k] || null,
      });
    }
  }

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="group chats" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        you were in
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={isCurrent ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.55, delay: isCurrent ? 0.1 : 0, ease: "easeOut" }}
        className="text-[clamp(4.5rem,14vw,11rem)] font-black leading-[0.9] tracking-[-0.06em] [text-shadow:0_8px_0_rgba(0,0,0,.06)]"
      >
        {fmtNum(s.uniqueGroups)}
      </motion.div>
      <motion.div {...fu(0.22)} className="text-[clamp(1.05rem,1.8vw,1.5rem)] opacity-85 max-w-[720px]">
        group chats — {fmtNum(groupTotal)} messages between them.
      </motion.div>
      {top && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <motion.div {...fu(0.34)} className="text-xs uppercase tracking-[0.15em] opacity-65">
            busiest group
          </motion.div>
          {participantEntries.length > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 22, delay: isCurrent ? 0.44 : 0 }}
            >
              <AvatarStack
                entries={participantEntries}
                limit={8}
                size="md"
              />
            </motion.div>
          )}
          <motion.div {...fu(0.54)} className="text-[clamp(1.4rem,3vw,2.4rem)] font-extrabold tracking-[-0.02em] bg-black/15 px-4 py-[0.35rem] rounded-2xl max-w-[80vw] break-words">
            {top.name || "(unnamed group)"}
          </motion.div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: isCurrent ? 0.64 : 0 }}
          >
            <Pill>
              {fmtNum(top.count)} messages · {top.participants} people
            </Pill>
          </motion.div>
        </div>
      )}
    </SlideShell>
  );
}
