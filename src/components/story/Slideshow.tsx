"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TextStatStats } from "@/types/stats";
import { PALETTES } from "@/lib/palettes";
import { HeroSlide } from "./slides/HeroSlide";
import { ActiveDaysSlide } from "./slides/ActiveDaysSlide";
import { TopContactSlide } from "./slides/TopContactSlide";
import { TopContactsListSlide } from "./slides/TopContactsListSlide";
import { SentVsReceivedSlide } from "./slides/SentVsReceivedSlide";
import { HourChartSlide } from "./slides/HourChartSlide";
import { DayOfWeekSlide } from "./slides/DayOfWeekSlide";
import { MonthlyTimelineSlide } from "./slides/MonthlyTimelineSlide";
import { TopWordsSlide } from "./slides/TopWordsSlide";
import { TopEmojisSlide } from "./slides/TopEmojisSlide";
import { ReactionsSlide } from "./slides/ReactionsSlide";
import { GroupChatsSlide } from "./slides/GroupChatsSlide";
import { StreakSlide } from "./slides/StreakSlide";
import { LongestMessageSlide } from "./slides/LongestMessageSlide";
import { ServiceMixSlide } from "./slides/ServiceMixSlide";
import { YouTextedMoreSlide, pickYouTextedMore } from "./slides/YouTextedMoreSlide";
import { TheyTextedMoreSlide, pickTheyTextedMore } from "./slides/TheyTextedMoreSlide";
import { LongestSentRunSlide } from "./slides/LongestSentRunSlide";
import { WrapSlide } from "./slides/WrapSlide";
import { StoryControls } from "./StoryControls";

interface SlideshowProps {
  stats: TextStatStats;
}

interface SlideConfig {
  Component: React.ComponentType<{
    stats: TextStatStats;
    palette: (typeof PALETTES)[number];
    isCurrent: boolean;
  }>;
  condition?: (stats: TextStatStats) => boolean;
}

export function Slideshow({ stats }: SlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const s = stats.summary;
  const isImsg = !!s.serviceCounts;

  const slidesConfig: SlideConfig[] = [
    { Component: HeroSlide },
    { Component: ActiveDaysSlide },
    { Component: TopContactSlide, condition: (s) => !!s.topContacts[0] },
    { Component: TopContactsListSlide, condition: (s) => s.topContacts.length > 1 },
    { Component: YouTextedMoreSlide, condition: (s) => !!pickYouTextedMore(s) },
    { Component: TheyTextedMoreSlide, condition: (s) => !!pickTheyTextedMore(s) },
    { Component: LongestSentRunSlide, condition: (s) => !!s.summary.longestSentRun && s.summary.longestSentRun.count >= 3 },
    { Component: SentVsReceivedSlide },
    { Component: HourChartSlide },
    { Component: DayOfWeekSlide },
    { Component: MonthlyTimelineSlide },
    { Component: TopWordsSlide, condition: (s) => s.topWords.length > 0 },
    { Component: TopEmojisSlide, condition: (s) => s.topEmojis.length > 0 },
    { Component: ReactionsSlide, condition: () => s.reactionsSent + s.reactionsRecv > 0 },
    { Component: GroupChatsSlide, condition: () => s.uniqueGroups > 0 },
    { Component: StreakSlide, condition: () => s.longestStreak > 1 },
    { Component: LongestMessageSlide, condition: () => !!s.longestBody && s.longestBody.len > 100 },
    { Component: ServiceMixSlide, condition: () => isImsg },
    { Component: WrapSlide },
  ];

  const slides = slidesConfig.filter(
    (s) => !s.condition || s.condition(stats)
  );

  const goTo = useCallback(
    (i: number) => {
      if (i < 0 || i >= slides.length) return;
      setCurrentSlide(i);
    },
    [slides.length]
  );

  const handlePrev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);
  const handleNext = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handlePrev, handleNext]);

  const handleRestart = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black">
      {/* Background layer: crossfades on slide change + calmly drifts */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence>
          <motion.div
            key={currentSlide}
            className="absolute inset-0"
            style={{ background: PALETTES[currentSlide % PALETTES.length].bg }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          />
        </AnimatePresence>

        {/* Calm drifting glow blob */}
        <motion.div
          className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-25"
          style={{
            background:
              "radial-gradient(55% 55% at 50% 50%, rgba(255,255,255,0.75) 0%, transparent 100%)",
          }}
          animate={{
            x: ["-18%", "28%", "-8%", "18%", "-18%"],
            y: ["12%", "-18%", "32%", "0%", "12%"],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Radial depth vignette */}
        <div className="absolute inset-[-10%] bg-[radial-gradient(closest-side,rgba(255,255,255,.18),transparent_65%)_20%_20%/60%_60%_no-repeat,radial-gradient(closest-side,rgba(0,0,0,.18),transparent_65%)_80%_80%/60%_60%_no-repeat]" />

        {/* Dot-grid texture */}
        <div className="absolute inset-0 opacity-35 mix-blend-overlay [background-image:radial-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      <div className="absolute inset-0">
        {slides.map(({ Component }, i) => {
          const palette = PALETTES[i % PALETTES.length];
          return (
            <Component
              key={i}
              stats={stats}
              palette={palette}
              isCurrent={i === currentSlide}
            />
          );
        })}
      </div>

      <StoryControls
        totalSlides={slides.length}
        currentSlide={currentSlide}
        onPrev={handlePrev}
        onNext={handleNext}
        onRestart={handleRestart}
      />
    </div>
  );
}
