export const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#ff5ea0,#ff9a3c)",
  "linear-gradient(135deg,#00f5d4,#00bbf9)",
  "linear-gradient(135deg,#ffd166,#ef476f)",
  "linear-gradient(135deg,#06d6a0,#118ab2)",
  "linear-gradient(135deg,#fb5607,#ff006e)",
  "linear-gradient(135deg,#8338ec,#3a86ff)",
  "linear-gradient(135deg,#ffbe0b,#fb5607)",
  "linear-gradient(135deg,#7400b8,#80ffdb)",
  "linear-gradient(135deg,#f72585,#4cc9f0)",
  "linear-gradient(135deg,#4361ee,#b5179e)",
  "linear-gradient(135deg,#2ec4b6,#e71d36)",
  "linear-gradient(135deg,#ff9f1c,#ffbf69)",
];

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

export function initialsOf(name: string): string {
  if (!name) return "?";
  const digits = name.replace(/\D/g, "");
  if (
    digits &&
    digits.length === name.replace(/[\s()+\-.]/g, "").length
  ) {
    return "#" + digits.slice(-2);
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarGradient(name: string): string {
  return AVATAR_GRADIENTS[hashString(name || "x") % AVATAR_GRADIENTS.length];
}
