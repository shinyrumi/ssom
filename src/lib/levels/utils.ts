import { LEVEL_ORDER, Level } from './types';

export function levelIndex(level: Level): number {
  const index = LEVEL_ORDER.indexOf(level);
  if (index === -1) {
    throw new Error(`Unknown level: ${level}`);
  }
  return index;
}

export function compareLevels(a: Level, b: Level): number {
  return levelIndex(a) - levelIndex(b);
}

export function nextLevel(level: Level): Level | null {
  const next = levelIndex(level) + 1;
  return LEVEL_ORDER[next] ?? null;
}

export function minLevel(a: Level, b: Level): Level {
  return compareLevels(a, b) <= 0 ? a : b;
}

export function maxLevel(a: Level, b: Level): Level {
  return compareLevels(a, b) >= 0 ? a : b;
}
