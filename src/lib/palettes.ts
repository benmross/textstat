export interface Palette {
  bg: string;
  fg: string;
  accent: string;
}

/** Returns black or white — whichever contrasts better against the given hex color. */
export function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#000000cc" : "#ffffffee";
}

export const PALETTES: Palette[] = [
  {
    bg: "radial-gradient(circle at 18% 15%,#b8ddff 0%,transparent 38%),linear-gradient(145deg,#5a8fd8 0%,#8c72c5 54%,#d49ab3 100%)",
    fg: "#10141c",
    accent: "#10141c",
  },
  {
    bg: "radial-gradient(circle at 80% 5%,#477fbd 0%,transparent 42%),linear-gradient(145deg,#0b1830 0%,#25355b 48%,#75526f 100%)",
    fg: "#f5f7fb",
    accent: "#c7e2ff",
  },
  {
    bg: "radial-gradient(circle at 15% 10%,#aee8df 0%,transparent 36%),linear-gradient(135deg,#5dc5c1 0%,#72acd7 55%,#9d8ac8 100%)",
    fg: "#0d1b27",
    accent: "#0d1b27",
  },
  {
    bg: "radial-gradient(circle at 70% 12%,#ffe2bd 0%,transparent 38%),linear-gradient(140deg,#e2bd88 0%,#d88f9a 52%,#9a7fbd 100%)",
    fg: "#241a25",
    accent: "#241a25",
  },
  {
    bg: "radial-gradient(circle at 20% 0%,#57a99b 0%,transparent 43%),linear-gradient(145deg,#183d3c 0%,#24566a 52%,#182b43 100%)",
    fg: "#f1fbf8",
    accent: "#bdebe1",
  },
  {
    bg: "radial-gradient(circle at 15% 5%,#e8a277 0%,transparent 38%),linear-gradient(145deg,#b35e61 0%,#945579 50%,#584c83 100%)",
    fg: "#fff7f2",
    accent: "#ffe0cf",
  },
  {
    bg: "radial-gradient(circle at 80% 0%,#835f9e 0%,transparent 42%),linear-gradient(145deg,#20172e 0%,#49335f 50%,#84564c 100%)",
    fg: "#f8f3fa",
    accent: "#e4caee",
  },
  {
    bg: "radial-gradient(circle at 20% 0%,#eee5fa 0%,transparent 40%),linear-gradient(145deg,#bcb4d1 0%,#dcb8c9 52%,#d5a8b2 100%)",
    fg: "#2b2333",
    accent: "#2b2333",
  },
  {
    bg: "radial-gradient(circle at 85% 10%,#8fced6 0%,transparent 38%),linear-gradient(145deg,#524f85 0%,#6688b5 55%,#70aaa4 100%)",
    fg: "#ffffff",
    accent: "#e0f5ff",
  },
];
