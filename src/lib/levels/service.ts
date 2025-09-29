import {
  LEVEL_ORDER,
  Level,
  LevelProgressInput,
  ProfileSnapshot,
  ReciprocalParams,
  UnlockAttempt,
  UnlockResult,
} from './types';
import { compareLevels, minLevel, nextLevel } from './utils';

const DEFAULT_BLOCK_REASON = 'sequential-only';

export function evaluateUnlock(attempt: UnlockAttempt): UnlockResult {
  const blocked: string[] = [];

  if (compareLevels(attempt.targetLevel, attempt.currentLevel) <= 0) {
    blocked.push('target-not-above-current');
  }

  if (nextLevel(attempt.currentLevel) !== attempt.targetLevel) {
    blocked.push(DEFAULT_BLOCK_REASON);
  }

  const pendingRequirements = attempt.requiredActions.filter(
    (action) => !attempt.completedActions.includes(action),
  );

  if (pendingRequirements.length > 0) {
    blocked.push(...pendingRequirements.map((action) => `pending:${action}`));
  }

  if (!attempt.isBoosted && pendingRequirements.length > 0) {
    blocked.push('boost-required');
  }

  if (blocked.length > 0) {
    return { success: false, unlockedLevel: null, blockedBy: Array.from(new Set(blocked)) };
  }

  return { success: true, unlockedLevel: attempt.targetLevel, blockedBy: [] };
}

export function resolveReciprocalLevel(params: ReciprocalParams): Level {
  return minLevel(params.viewerLevel, params.targetLevel);
}

export function calculateProgress(input: LevelProgressInput): ProfileSnapshot['progress'] {
  const next = nextLevel(input.currentLevel);

  if (!next) {
    return { current: input.currentLevel, next: null, percent: 100, requiredActions: [] };
  }

  const currentThreshold = input.thresholds[input.currentLevel] ?? 0;
  const nextThreshold = input.thresholds[next];

  if (typeof nextThreshold !== 'number') {
    throw new Error(`Missing threshold for ${next}`);
  }

  const progressRange = Math.max(nextThreshold - currentThreshold, 1);
  const raw = ((input.xp - currentThreshold) / progressRange) * 100;
  const percent = clamp(raw, 0, 99.99);

  return {
    current: input.currentLevel,
    next,
    percent,
    requiredActions: [],
  };
}

export function computeLockedLevels(reciprocalLevel: Level): Level[] {
  const index = LEVEL_ORDER.indexOf(reciprocalLevel);
  return LEVEL_ORDER.slice(index + 1);
}

export type ProfileFieldsPayload = {
  basic: Record<string, unknown>;
  vibe?: Record<string, unknown>;
  trust?: Record<string, unknown>;
  intent?: Record<string, unknown>;
};

export function buildProfileSnapshot(params: {
  profileId: string;
  viewerLevel: Level;
  targetLevel: Level;
  fields: ProfileFieldsPayload;
  progress: ProfileSnapshot['progress'];
}): ProfileSnapshot {
  const reciprocalLevel = resolveReciprocalLevel({
    viewerLevel: params.viewerLevel,
    targetLevel: params.targetLevel,
  });

  return {
    profileId: params.profileId,
    reciprocalLevel,
    fields: {
      basic: params.fields.basic,
      vibe: compareLevels(reciprocalLevel, 'L2') >= 0 ? params.fields.vibe ?? null : null,
      trust: compareLevels(reciprocalLevel, 'L3') >= 0 ? params.fields.trust ?? null : null,
      intent: compareLevels(reciprocalLevel, 'L4') >= 0 ? params.fields.intent ?? null : null,
    },
    lockedLevels: computeLockedLevels(reciprocalLevel),
    progress: params.progress,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
