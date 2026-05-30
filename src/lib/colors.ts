// GitHub language colors — minimal but distinctive palette
export const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  Dart: "#00B4AB",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Lua: "#000080",
  Zig: "#ec915c",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  Scala: "#c22d40",
  Clojure: "#db5855",
  R: "#198CE7",
  PHP: "#4F5D95",
  MDX: "#fcb32c",
  Markdown: "#083fa1",
  SCSS: "#c6538c",
  Less: "#1d365d",
} as const;

export const DEFAULT_COLOR = "#6b7280";
export const BG_COLOR = "#050510";

export function getLangColor(lang: string): string {
  return LANG_COLORS[lang] ?? DEFAULT_COLOR;
}

// GitHub-style color with slight glow for 3D rendering
export function getGlowColor(lang: string): string {
  const base = getLangColor(lang);
  // Brighten the color for glow effect
  const hex = base.replace("#", "");
  const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + 60);
  const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + 60);
  const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + 60);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
