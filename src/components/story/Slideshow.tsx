"use client";

import { useEffect, useCallback, useState, useRef } from "react";
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
