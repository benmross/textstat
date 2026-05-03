"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Palette } from "@/lib/palettes";

interface SlideShellProps {
  label: string;
  palette: Palette;
  isCurrent: boolean;
  children: ReactNode;
}

export function SlideShell({
  label,
  palette,
  isCurrent,
  children,
}: SlideShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={
        isCurrent
          ? { opacity: 1, scale: 1 }
          : { opacity: 0, scale: 0.985 }
      }
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden px-[clamp(1.5rem,5vw,4.5rem)] py-16 text-center"
      style={{ color: palette.fg }}
    >
      <div
        className="absolute top-[clamp(1rem,3vw,2rem)] left-1/2 z-[2] -translate-x-1/2 rounded-full border border-white/20 bg-black/20 px-[1.1rem] py-[0.45rem] font-mono text-xs uppercase tracking-[0.25em]"
        style={{ color: palette.fg }}
      >
        {label}
      </div>

      <div className="relative z-[1] flex w-[min(1100px,100%)] flex-col items-center justify-center gap-3">
        {children}
      </div>
    </motion.div>
  );
}
