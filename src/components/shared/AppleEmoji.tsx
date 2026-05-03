"use client";

import { useState } from "react";

// Convert an emoji string to the codepoint path used by emoji-datasource-apple.
// e.g. "❤️" → "2764-fe0f"
function cdnPath(emoji: string): string {
  return [...emoji]
    .map((cp) => cp.codePointAt(0)!.toString(16).toLowerCase())
    .join("-");
}

const CDN = "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64";

interface Props {
  emoji: string;
  /** CSS class applied to the img or fallback span */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders an emoji using Apple's emoji images served from jsDelivr.
 * Sizing matches the parent element's font-size via `width/height: 1em`.
 * Falls back to a plain text span with system emoji font on CDN error.
 */
export function AppleEmoji({ emoji, className, style }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={className}
        style={{
          fontFamily:
            "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif",
          ...style,
        }}
      >
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={`${CDN}/${cdnPath(emoji)}.png`}
      alt={emoji}
      className={className}
      style={{
        width: "1em",
        height: "1em",
        display: "inline-block",
        verticalAlign: "-0.1em",
        ...style,
      }}
      onError={() => setFailed(true)}
    />
  );
}
