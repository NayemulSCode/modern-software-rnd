import type { CSSProperties } from "react";

// Three-colour palettes in a mid-century print range: [field, figure, accent].
const PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ["#e0421c", "#f2eadb", "#1a1612"],
  ["#1e4640", "#f0c24b", "#f2eadb"],
  ["#2b4ea0", "#f2eadb", "#e0421c"],
  ["#f0c24b", "#1a1612", "#f2eadb"],
  ["#6b2d4f", "#f3b8a0", "#f2eadb"],
  ["#1e4640", "#e9a48b", "#1a1612"],
  ["#1a1612", "#f0c24b", "#e0421c"],
  ["#c96f3b", "#f2eadb", "#1e4640"],
];

const PATTERNS: ReadonlyArray<(a: string, b: string, c: string, turn: number) => string> = [
  (a, b) => `repeating-radial-gradient(circle at 28% 72%, ${a} 0 9%, ${b} 9% 18%)`,
  (a, b, _c, turn) => `repeating-linear-gradient(${turn}deg, ${a} 0 11%, ${b} 11% 22%)`,
  (a, b, c) =>
    `radial-gradient(circle at 50% 100%, ${b} 0 46%, transparent 46.5%), radial-gradient(circle at 50% 100%, ${c} 0 62%, transparent 62.5%), ${a}`,
  (a, b, c) =>
    `radial-gradient(circle at 0 0, ${b} 0 62%, transparent 62.5%), radial-gradient(circle at 76% 76%, ${c} 0 13%, transparent 13.5%), ${a}`,
  (a, b, c, turn) =>
    `radial-gradient(circle at 50% 50%, ${c} 0 21%, transparent 21.5%), linear-gradient(${turn}deg, ${a} 0 50%, ${b} 50%)`,
  (a, b) => `repeating-conic-gradient(from 0deg at 50% 112%, ${a} 0 9deg, ${b} 9deg 18deg)`,
];

/**
 * Turns a number into a record-sleeve style background. Pure CSS, so covers
 * cost zero network requests and can never cause layout shift while loading.
 */
export function coverStyle(seed: number): CSSProperties {
  const [a, b, c] = PALETTES[(seed >>> 3) % PALETTES.length];
  const pattern = PATTERNS[seed % PATTERNS.length];
  const turn = [45, 90, 135, 0][(seed >>> 7) % 4];
  return { background: pattern(a, b, c, turn) };
}
