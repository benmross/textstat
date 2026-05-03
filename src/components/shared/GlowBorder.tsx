"use client";

import { cn } from "@/lib/utils";

interface GlowBorderProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowBorder({
  children,
  className,
  glowColor = "#aef639",
}: GlowBorderProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        className="absolute -inset-[1px] rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${glowColor}22, ${glowColor}44, ${glowColor}22)`,
        }}
      />
      <div
        className="absolute -inset-[1px] rounded-[inherit] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60"
        style={{
          background: glowColor,
        }}
      />
      {children}
    </div>
  );
}
