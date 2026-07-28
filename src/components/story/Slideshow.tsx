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
import { CalendarHeatmapSlide } from "./slides/CalendarHeatmapSlide";
import { TopWordsSlide } from "./slides/TopWordsSlide";
import { TopEmojisSlide } from "./slides/TopEmojisSlide";
import { ReactionsSlide } from "./slides/ReactionsSlide";
import { GroupChatsSlide } from "./slides/GroupChatsSlide";
import { StreakSlide } from "./slides/StreakSlide";
import { LongestMessageSlide } from "./slides/LongestMessageSlide";
import { YouTextedMoreSlide, pickYouTextedMore } from "./slides/YouTextedMoreSlide";
import { TheyTextedMoreSlide, pickTheyTextedMore } from "./slides/TheyTextedMoreSlide";
import { LongestSentRunSlide } from "./slides/LongestSentRunSlide";
import { WrapSlide } from "./slides/WrapSlide";
import { StoryControls } from "./StoryControls";

interface SlideshowProps {
  stats: TextStatStats;
}

interface SlideConfig {
  label: string;
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

  const slidesConfig: SlideConfig[] = [
    { label: "Your message story", Component: HeroSlide },
    { label: "Days together", Component: ActiveDaysSlide },
    { label: "Your favorite person", Component: TopContactSlide, condition: (s) => !!s.topContacts[0] },
    { label: "Inner circle", Component: TopContactsListSlide, condition: (s) => s.topContacts.length > 1 },
    { label: "You texted more", Component: YouTextedMoreSlide, condition: (s) => !!pickYouTextedMore(s) },
    { label: "They texted more", Component: TheyTextedMoreSlide, condition: (s) => !!pickTheyTextedMore(s) },
    { label: "On a roll", Component: LongestSentRunSlide, condition: (s) => !!s.summary.longestSentRun && s.summary.longestSentRun.count >= 3 },
    { label: "Sent and received", Component: SentVsReceivedSlide },
    { label: "Your hours", Component: HourChartSlide },
    { label: "Your week", Component: DayOfWeekSlide },
    { label: "Over time", Component: MonthlyTimelineSlide },
    { label: "Message calendar", Component: CalendarHeatmapSlide, condition: (s) => s.calDays.length > 0 },
    { label: "Your words", Component: TopWordsSlide, condition: (s) => s.topWords.length > 0 },
    { label: "Your emoji", Component: TopEmojisSlide, condition: (s) => s.topEmojis.length > 0 },
    { label: "Reactions", Component: ReactionsSlide, condition: () => s.reactionsSent + s.reactionsRecv > 0 },
    { label: "Group chats", Component: GroupChatsSlide, condition: () => s.uniqueGroups > 0 },
    { label: "Your streak", Component: StreakSlide, condition: () => s.longestStreak > 1 },
    { label: "The long one", Component: LongestMessageSlide, condition: () => (s.longestSentBody?.len ?? 0) > 100 || (s.longestRecvBody?.len ?? 0) > 100 },
    { label: "Your textstat", Component: WrapSlide },
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

  const handleShare = useCallback(async () => {
    const slide = slides[currentSlide];
    const text = `${slide.label} — my textstat from ${stats.summary.totalMessages.toLocaleString()} messages.`;
    const shareData = { title: "My textstat", text, url: window.location.origin };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(`${text} ${shareData.url}`);
  }, [currentSlide, slides, stats.summary.totalMessages]);

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
        {slides.map(({ Component, label }, i) => {
          const palette = PALETTES[i % PALETTES.length];
          return (
            <Component
              key={label}
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
        onShare={handleShare}
        shareLabel={`${currentSlide + 1} of ${slides.length} · ${slides[currentSlide].label}`}
      />
    </div>
  );
}
