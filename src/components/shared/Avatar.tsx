"use client";

import { cn } from "@/lib/utils";
import { avatarGradient, initialsOf } from "@/lib/avatars";

interface AvatarEntry {
  displayName?: string;
  name?: string;
  contact?: string;
  photo?: string | null;
}

interface AvatarProps {
  entry: AvatarEntry;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-[0.72rem]",
  md: "w-[52px] h-[52px] text-[1.05rem]",
  lg: "w-24 h-24 text-2xl",
  xl: "w-[clamp(120px,18vw,180px)] h-[clamp(120px,18vw,180px)] text-[clamp(2.4rem,5vw,3.6rem)]",
};

export function Avatar({ entry, size = "md", className }: AvatarProps) {
  const name =
    (entry && (entry.displayName || entry.name || entry.contact)) || "";
  const photo = entry && entry.photo;

  if (photo) {
    return (
      <div
        className={cn(
          "inline-grid place-items-center rounded-full bg-cover bg-center font-extrabold tracking-tight text-white shadow-[0_4px_14px_-4px_rgba(0,0,0,.35),inset_0_0_0_2px_rgba(255,255,255,.22)]",
          sizeClasses[size],
          size === "xl" &&
            "shadow-[0_22px_44px_-14px_rgba(0,0,0,.5),inset_0_0_0_3px_rgba(255,255,255,.28)]",
          className
        )}
        style={{ backgroundImage: `url("${photo.replace(/"/g, "%22")}")` }}
        title={name}
        aria-label={name}
      />
    );
  }

  const grad = avatarGradient(name || "x");
  return (
    <div
      className={cn(
        "inline-grid place-items-center rounded-full font-extrabold tracking-tight text-white shadow-[0_4px_14px_-4px_rgba(0,0,0,.35),inset_0_0_0_2px_rgba(255,255,255,.22)]",
        sizeClasses[size],
        size === "xl" &&
          "shadow-[0_22px_44px_-14px_rgba(0,0,0,.5),inset_0_0_0_3px_rgba(255,255,255,.28)]",
        className
      )}
      style={{ background: grad }}
      title={name}
      aria-label={name}
    >
      <span
        className="leading-none [text-shadow:0_1px_1px_rgba(0,0,0,.25)]"
        style={{ lineHeight: 1 }}
      >
        {initialsOf(name)}
      </span>
    </div>
  );
}

export function AvatarStack({
  entries,
  limit = 5,
  size = "sm",
  accentColor,
}: {
  entries: AvatarEntry[];
  limit?: number;
  size?: "sm" | "md" | "lg" | "xl";
  accentColor?: string;
}) {
  const visible = entries.slice(0, limit);
  const extra = Math.max(0, entries.length - limit);

  return (
    <div className="inline-flex items-center pl-2">
      {visible.map((entry, i) => (
        <div
          key={i}
          className="-ml-2 first:ml-0"
          style={{
            boxShadow: accentColor
              ? `0 4px 14px -4px rgba(0,0,0,.35), inset 0 0 0 2px rgba(255,255,255,.22), 0 0 0 2px ${accentColor}`
              : undefined,
          }}
        >
          <Avatar entry={entry} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className={cn(
            "-ml-2 inline-grid place-items-center rounded-full bg-black/30 font-extrabold text-white/90",
            sizeClasses[size]
          )}
        >
          <span className="leading-none [text-shadow:0_1px_1px_rgba(0,0,0,.25)]">
            +{extra}
          </span>
        </div>
      )}
    </div>
  );
}
