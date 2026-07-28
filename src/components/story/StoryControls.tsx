"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, RotateCcw, Share } from "lucide-react";

interface StoryControlsProps {
  totalSlides: number;
  currentSlide: number;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  onShare: () => void;
  shareLabel: string;
}

export function StoryControls({
  totalSlides,
  currentSlide,
  onPrev,
  onNext,
  onRestart,
  onShare,
  shareLabel,
}: StoryControlsProps) {
  const [shared, setShared] = useState(false);
  const share = async () => {
    await onShare();
    setShared(true);
    window.setTimeout(() => setShared(false), 1600);
  };
  return (
    <>
      <div className="absolute left-1/2 top-4 z-[6] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-[11px] font-medium tracking-[.04em] text-white/65 shadow-lg backdrop-blur-2xl">
        {shareLabel}
      </div>
      <div className="absolute right-4 top-4 z-[6] flex gap-2">
        <button onClick={share} className="story-glass-button" aria-label="Share this statistic">
          {shared ? <Check size={16} /> : <Share size={16} />}
          <span className="hidden sm:inline">{shared ? "Ready to share" : "Share"}</span>
        </button>
        <button
          onClick={onRestart}
          className="story-glass-button"
          aria-label="Start over"
        >
          <RotateCcw size={16} /><span className="hidden sm:inline">Start over</span>
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 z-[5] flex w-[min(680px,calc(100%-24px))] -translate-x-1/2 items-center gap-3 rounded-[22px] border border-white/15 bg-black/20 p-2.5 shadow-[0_20px_60px_rgba(0,0,0,.25)] backdrop-blur-2xl">
        <button
          onClick={onPrev}
          disabled={currentSlide === 0}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-[14px] bg-white/12 text-white transition-all hover:bg-white/20 disabled:opacity-25"
          aria-label="previous"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex flex-1 gap-1">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                "h-1 flex-1 cursor-default rounded-full transition-colors duration-300",
                i <= currentSlide ? "bg-white/85" : "bg-white/20"
              )}
            />
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={currentSlide === totalSlides - 1}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-[14px] bg-white/12 text-white transition-all hover:bg-white/20 disabled:opacity-25"
          aria-label="next"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </>
  );
}
