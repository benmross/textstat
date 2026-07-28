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
      aria-label={label}
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden px-[clamp(1.5rem,5vw,4.5rem)] py-20 text-center"
      style={{ color: palette.fg }}
    >
      <div className="relative z-[1] flex w-[min(1100px,100%)] flex-col items-center justify-center gap-3">
        {children}
      </div>
    </motion.div>
  );
}
