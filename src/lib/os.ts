"use client";

import { useSyncExternalStore } from "react";

export type DesktopOS = "mac" | "windows" | "other";

interface UADataLike {
  platform?: string;
}

// Detect the host OS so the iPhone guide can show the right app, the right
// backup path, and the right keyboard shortcut. `userAgentData.platform` is the
// modern signal (Chromium); everything else falls back to UA sniffing.
export function detectOS(): DesktopOS {
  if (typeof navigator === "undefined") return "other";

  const uaData = (navigator as Navigator & { userAgentData?: UADataLike })
    .userAgentData;
  const platform = (uaData?.platform || "").toLowerCase();
  if (platform.includes("mac")) return "mac";
  if (platform.includes("win")) return "windows";

  const ua = navigator.userAgent || "";
  // iPadOS reports a Mac UA but has touch points — it is not a desktop Mac.
  if (/iPhone|iPad|iPod/.test(ua)) return "other";
  if (/Macintosh|Mac OS X/.test(ua)) {
    if (navigator.maxTouchPoints > 1) return "other";
    return "mac";
  }
  if (/Windows/.test(ua)) return "windows";
  return "other";
}

// Detection depends on the UA, so the server can only assume "other". Going
// through useSyncExternalStore keeps the hydration pass consistent and swaps in
// the real value without a setState-in-effect cascade. The snapshot has to be
// referentially stable, hence the cache.
let cachedOS: DesktopOS | null = null;
function osSnapshot(): DesktopOS {
  if (cachedOS === null) cachedOS = detectOS();
  return cachedOS;
}
const serverSnapshot = (): DesktopOS => "other";
const noopSubscribe = () => () => {};

export function useDesktopOS(): DesktopOS {
  return useSyncExternalStore(noopSubscribe, osSnapshot, serverSnapshot);
}

// The File System Access API gives us direct path lookups inside a backup
// folder (no enumeration of the ~100k files a backup contains). Chromium only —
// Firefox and Safari ship OPFS but not the disk pickers.
export function supportsDirectoryPicker(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as Window & { showDirectoryPicker?: unknown })
      .showDirectoryPicker === "function"
  );
}

export const OS_LABEL: Record<DesktopOS, string> = {
  mac: "Mac",
  windows: "Windows",
  other: "your computer",
};

// Where Finder / Apple Devices / iTunes write local backups.
export interface BackupLocation {
  label: string;
  path: string;
}

export function backupLocations(os: DesktopOS): BackupLocation[] {
  if (os === "mac") {
    return [
      {
        label: "Finder",
        path: "~/Library/Application Support/MobileSync/Backup",
      },
    ];
  }
  if (os === "windows") {
    return [
      { label: "Apple Devices app", path: "%USERPROFILE%\\Apple\\MobileSync\\Backup" },
      { label: "Older iTunes", path: "%APPDATA%\\Apple Computer\\MobileSync\\Backup" },
    ];
  }
  return [
    { label: "Mac", path: "~/Library/Application Support/MobileSync/Backup" },
    { label: "Windows", path: "%USERPROFILE%\\Apple\\MobileSync\\Backup" },
  ];
}
