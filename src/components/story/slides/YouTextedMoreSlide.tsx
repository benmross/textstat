"use client";

import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { Pill } from "@/components/shared/Pill";
import { Avatar } from "@/components/shared/Avatar";
import { Palette, contrastColor } from "@/lib/palettes";
import { TextStatStats, ContactEntry } from "@/types/stats";
import { fmtNum } from "@/lib/formatting";

const MIN_TOTAL = 15;

export function pickYouTextedMore(stats: TextStatStats): ContactEntry | null {
  return (
    stats.topContacts
      .filter((c) => c.total >= MIN_TOTAL && c.sent > c.recv)
      .sort((a, b) => b.sent / (b.recv || 1) - a.sent / (a.recv || 1))[0] ?? null
  );
}

interface Props {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

export function YouTextedMoreSlide({ stats, palette, isCurrent }: Props) {
  const contact = pickYouTextedMore(stats);
  if (!contact) return null;

  const ratio = contact.sent / (contact.recv || 1);
  const ratioStr = ratio >= 10 ? `${Math.round(ratio)}×` : `${ratio.toFixed(1)}×`;

  const fu = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay: isCurrent ? delay : 0, ease: "easeOut" as const },
  });

  return (
    <SlideShell label="one-sided convo" palette={palette} isCurrent={isCurrent}>
      <motion.div {...fu(0)} className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium">
        you carried this one.
      </motion.div>
      <motion.div {...fu(0.08)} className="text-[0.85rem] uppercase tracking-[0.15em] opacity-65">
        you out-texted them by {ratioStr}
      </motion.div>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 18, delay: isCurrent ? 0.18 : 0 }}
        className="my-1 flex justify-center"
      >
        <Avatar entry={contact} size="xl" />
      </motion.div>
      <motion.div
        {...fu(0.36)}
        className="text-[clamp(2.6rem,8vw,6rem)] font-black leading-none tracking-[-0.04em] break-words"
      >
        {contact.displayName}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={isCurrent ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
        transition={{
          duration: isCurrent ? 0.7 : 0.2,
          delay: isCurrent ? 0.44 : 0,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{ transformOrigin: "left" }}
        className="w-[min(680px,100%)] mt-4"
      >
        <div className="flex h-[72px] rounded-[18px] overflow-hidden border-2 border-black/15">
          <div
            className="flex flex-col items-center justify-center min-w-0 px-3 py-1 font-mono text-sm"
            style={{ flex: contact.sent, backgroundColor: palette.fg, color: contrastColor(palette.fg) }}
          >
            <span className="text-xs uppercase tracking-[0.15em] opacity-70">you</span>
            <span className="text-[clamp(1rem,2vw,1.5rem)] font-extrabold">{fmtNum(contact.sent)}</span>
          </div>
          <div
            className="flex flex-col items-center justify-center min-w-0 px-3 py-1 font-mono text-sm"
            style={{ flex: contact.recv || 1, backgroundColor: "rgba(0,0,0,.25)", color: "rgba(255,255,255,0.9)" }}
          >
            <span className="text-xs uppercase tracking-[0.15em] opacity-70">them</span>
            <span className="text-[clamp(1rem,2vw,1.5rem)] font-extrabold">{fmtNum(contact.recv)}</span>
          </div>
        </div>
      </motion.div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {[`${ratioStr} the texts`, `${fmtNum(contact.total)} total`].map((text, i) => (
          <motion.div
            key={text}
            initial={{ scale: 0, opacity: 0 }}
            animate={isCurrent ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
              delay: isCurrent ? 0.88 + i * 0.07 : 0,
            }}
          >
            <Pill alt={i === 1}>{text}</Pill>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
