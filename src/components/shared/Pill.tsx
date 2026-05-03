"use client";

import { cn } from "@/lib/utils";

export function Pill({
  children,
  alt,
  className,
}: {
  children: React.ReactNode;
  alt?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/15 px-[1.05rem] py-[.55rem] text-[.95rem]",
        alt
          ? "bg-white/90 text-black/85 border-transparent font-semibold"
          : "bg-black/20",
        className
      )}
    >
      {children}
    </span>
  );
}
