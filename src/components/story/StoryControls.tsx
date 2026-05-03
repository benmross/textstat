"use client";

import { cn } from "@/lib/utils";

interface StoryControlsProps {
  totalSlides: number;
  currentSlide: number;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
}

export function StoryControls({
  totalSlides,
  currentSlide,
  onPrev,
  onNext,
  onRestart,
}: StoryControlsProps) {
  return (
    <>
      <div className="absolute right-4 top-5 z-[6]">
        <button
          onClick={onRestart}
          className="rounded-full border border-white/15 bg-black/35 px-[0.9rem] py-[0.5rem] font-mono text-xs uppercase tracking-[0.12em] text-white backdrop-blur-md transition-colors hover:bg-black/55"
        >
          ↺ start over
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-[5] flex items-center gap-4 px-6 pt-4 pb-6">
        <button
          onClick={onPrev}
          className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full bg-white/15 text-[1.4rem] leading-none text-white backdrop-blur-md transition-all hover:bg-white/25 hover:scale-105"
          aria-label="previous"
        >
          ‹
        </button>

        <div className="flex flex-1 gap-1">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full cursor-pointer transition-colors duration-300",
                i <= currentSlide ? "bg-white/85" : "bg-white/20"
              )}
            />
          ))}
        </div>

        <button
          onClick={onNext}
          className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full bg-white/15 text-[1.4rem] leading-none text-white backdrop-blur-md transition-all hover:bg-white/25 hover:scale-105"
          aria-label="next"
        >
          ›
        </button>
      </div>
    </>
  );
}
