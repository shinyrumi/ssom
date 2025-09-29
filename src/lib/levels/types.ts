export type Level = 'L1' | 'L2' | 'L3' | 'L4';

export const LEVEL_ORDER: Level[] = ['L1', 'L2', 'L3', 'L4'];

export type LevelFields = {
  basic: Record<string, unknown> | null;
  vibe: Record<string, unknown> | null;
  trust: Record<string, unknown> | null;
  intent: Record<string, unknown> | null;
};

export type ProfileSnapshot = {
  profileId: string;
  reciprocalLevel: Level;
  fields: LevelFields;
  lockedLevels: Level[];
  progress: Progress;
};

export type Progress = {
  current: Level;
  next: Level | null;
  percent: number;
  requiredActions: string[];
};

export type UnlockAttempt = {
  profileId: string;
  currentLevel: Level;
  targetLevel: Level;
  completedActions: string[];
  requiredActions: string[];
  isBoosted: boolean;
};

export type UnlockResult = {
  success: boolean;
  unlockedLevel: Level | null;
  blockedBy: string[];
};

export type LevelProgressInput = {
  xp: number;
  thresholds: Record<Level, number>;
  currentLevel: Level;
};

export type ReciprocalParams = {
  viewerLevel: Level;
  targetLevel: Level;
};
