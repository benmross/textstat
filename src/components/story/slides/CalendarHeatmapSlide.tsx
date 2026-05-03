"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { SlideShell } from "@/components/story/SlideShell";
import { Palette } from "@/lib/palettes";
import { TextStatStats, DayEntry } from "@/types/stats";
import { MONTH_NAMES } from "@/lib/formatting";

interface CalendarHeatmapSlideProps {
  stats: TextStatStats;
  palette: Palette;
  isCurrent: boolean;
}

interface MonthGrid {
  key: string;   // YYYY-MM
  year: number;
  month: number; // 1-based
  // cells: null = padding, number = message count (0 = active day with 0 shown)
  cells: (number | null)[];
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

function buildMonthGrids(calDays: DayEntry[]): MonthGrid[] {
  const byMonth = new Map<string, Map<string, number>>();
  for (const { ymd, count } of calDays) {
    const key = ymd.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, new Map());
    byMonth.get(key)!.set(ymd, count);
  }

  return Array.from(byMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, dayMap]) => {
      const [y, mo] = key.split("-").map(Number);
      const firstDow = new Date(y, mo - 1, 1).getDay(); // 0=Sun
      const daysInMonth = new Date(y, mo, 0).getDate();
      const cells: (number | null)[] = Array(firstDow).fill(null);
      for (let d = 1; d <= daysInMonth; d++) {
        const ymd = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        cells.push(dayMap.get(ymd) ?? 0);
      }
      while (cells.length % 7 !== 0) cells.push(null);
      return { key, year: y, month: mo, cells };
    });
}

// Calendar fills a fixed visual footprint (≈960×440) regardless of month count.
// We pick a row count, derive cols, then scale square size to fit width AND height.
function layoutParams(n: number): { rows: number; cols: number; sq: number; gap: number } {
  const rows =
    n <= 4  ? 1 :
    n <= 12 ? 2 :
    n <= 24 ? 3 :
    n <= 40 ? 4 :
    n <= 60 ? 5 : 6;
  const cols = Math.ceil(n / rows);

  const TARGET_W = 960;
  const TARGET_H = 440;
  const COL_GAP = 18;          // horizontal gap between month grids
  const ROW_GAP = 22;          // vertical gap between month rows
  const INNER_GAP = 2;         // gap between day cells
  const HEADER_H = 26;         // month label + DOW row + their gaps

  // month grid width  = 7*sq + 6*INNER_GAP
  // month grid height = HEADER_H + 6*sq + 5*INNER_GAP   (6 visible weeks)
  const sqFromW = ((TARGET_W - (cols - 1) * COL_GAP) / cols - 6 * INNER_GAP) / 7;
  const sqFromH = ((TARGET_H - (rows - 1) * ROW_GAP) / rows - HEADER_H - 5 * INNER_GAP) / 6;
  const sq = Math.max(5, Math.min(28, Math.floor(Math.min(sqFromW, sqFromH))));
  const gap = sq <= 7 ? 1 : 2;
  return { rows, cols, sq, gap };
}

export function CalendarHeatmapSlide({
  stats,
  palette,
  isCurrent,
}: CalendarHeatmapSlideProps) {
  const calDays = stats.calDays;
  if (!calDays?.length) return null;

  const { months, maxCount, layout } = useMemo(() => {
    const months = buildMonthGrids(calDays);
    const maxCount = Math.max(...calDays.map((d) => d.count), 1);
    const layout = layoutParams(months.length);
    return { months, maxCount, layout };
  }, [calDays]);

  const { cols, sq, gap } = layout;

  const DOW = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <SlideShell label="day by day" palette={palette} isCurrent={isCurrent}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-[clamp(1rem,1.5vw,1.3rem)] opacity-80 font-medium"
      >
        message calendar
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isCurrent ? 1 : 0 }}
        transition={{ duration: 0.55, delay: isCurrent ? 0.14 : 0 }}
        className="mt-4 grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, auto)`,
          columnGap: `18px`,
          rowGap: `22px`,
          justifyContent: "center",
        }}
      >
        {months.map(({ key, year, month, cells }, mi) => {
          const prevKey = months[mi - 1]?.key;
          const prevYear = prevKey ? parseInt(prevKey.slice(0, 4)) : null;
          const showYear = prevYear === null || year !== prevYear;
          const label = showYear
            ? `${MONTH_NAMES[month - 1]} '${String(year).slice(2)}`
            : MONTH_NAMES[month - 1];
          const weeks = Math.ceil(cells.length / 7);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={isCurrent ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
              transition={{
                duration: 0.35,
                delay: isCurrent ? 0.18 + mi * 0.025 : 0,
                ease: "easeOut",
              }}
              className="flex flex-col items-center"
              style={{ gap: `${gap + 2}px` }}
            >
              {/* Month label */}
              <div
                className="font-semibold uppercase tracking-wide text-center w-full"
                style={{
                  fontSize: `${Math.max(8, Math.min(13, Math.round(sq * 0.55)))}px`,
                  opacity: showYear ? 0.9 : 0.6,
                  color: "inherit",
                }}
              >
                {label}
              </div>

              {/* Day-of-week header */}
              <div
                className="grid"
                style={{ gridTemplateColumns: `repeat(7, ${sq}px)`, gap: `${gap}px` }}
              >
                {DOW.map((d, i) => (
                  <div
                    key={i}
                    className="text-center font-bold"
                    style={{
                      width: sq,
                      fontSize: `${Math.max(6, Math.min(10, Math.round(sq * 0.42)))}px`,
                      opacity: 0.45,
                      lineHeight: 1,
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(7, ${sq}px)`,
                  gridTemplateRows: `repeat(${weeks}, ${sq}px)`,
                  gap: `${gap}px`,
                }}
              >
                {cells.map((count, ci) => {
                  const isEmpty = count === null;
                  const hasMsg = !isEmpty && count > 0;
                  const alpha = hasMsg
                    ? 0.18 + 0.82 * (count / maxCount)
                    : 0;
                  return (
                    <div
                      key={ci}
                      style={{
                        width: sq,
                        height: sq,
                        borderRadius: Math.max(1, Math.round(sq / 4)),
                        backgroundColor: isEmpty
                          ? "transparent"
                          : hasMsg
                          ? hexToRgba(palette.fg, alpha)
                          : "rgba(255,255,255,0.07)",
                      }}
                    />
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </SlideShell>
  );
}
