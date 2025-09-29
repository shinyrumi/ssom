import { buildProfileSnapshot, calculateProgress, evaluateUnlock } from './service';
import { LevelProgressInput, ProfileFieldsPayload, UnlockAttempt } from './types';

describe('evaluateUnlock', () => {
  const baseAttempt: UnlockAttempt = {
    profileId: 'viewer-1',
    currentLevel: 'L1',
    targetLevel: 'L2',
    completedActions: ['answer-today-question'],
    requiredActions: ['answer-today-question'],
    isBoosted: false,
  };

  it('allows sequential unlock when requirements met', () => {
    const result = evaluateUnlock(baseAttempt);
    expect(result.success).toBe(true);
    expect(result.unlockedLevel).toBe('L2');
    expect(result.blockedBy).toEqual([]);
  });

  it('blocks when skipping a level', () => {
    const result = evaluateUnlock({ ...baseAttempt, targetLevel: 'L3' });
    expect(result.success).toBe(false);
    expect(result.blockedBy).toContain('sequential-only');
  });

  it('captures pending requirements', () => {
    const result = evaluateUnlock({
      ...baseAttempt,
      completedActions: [],
    });
    expect(result.success).toBe(false);
    expect(result.blockedBy).toEqual(expect.arrayContaining(['pending:answer-today-question']));
  });
});

describe('calculateProgress', () => {
  const thresholds: LevelProgressInput['thresholds'] = {
    L1: 0,
    L2: 100,
    L3: 250,
    L4: 500,
  };

  it('returns percent toward next level', () => {
    const progress = calculateProgress({ xp: 150, thresholds, currentLevel: 'L2' });
    expect(progress.percent).toBeCloseTo(33.33, 1);
    expect(progress.next).toBe('L3');
  });

  it('caps at 100 when max level reached', () => {
    const progress = calculateProgress({ xp: 999, thresholds, currentLevel: 'L4' });
    expect(progress.percent).toBe(100);
    expect(progress.next).toBeNull();
  });
});

describe('buildProfileSnapshot', () => {
  const fields: ProfileFieldsPayload = {
    basic: { nickname: 'SSOM' },
    vibe: { status: 'Exploring' },
    trust: { photoUrl: 'https://example.com/p.jpg' },
    intent: { relationship: 'serious' },
  };

  it('masks fields above reciprocal level', () => {
    const snapshot = buildProfileSnapshot({
      profileId: 'target-1',
      viewerLevel: 'L1',
      targetLevel: 'L3',
      fields,
      progress: {
        current: 'L3',
        next: 'L4',
        percent: 40,
        requiredActions: [],
      },
    });

    expect(snapshot.reciprocalLevel).toBe('L1');
    expect(snapshot.fields.basic).toEqual({ nickname: 'SSOM' });
    expect(snapshot.fields.vibe).toBeNull();
    expect(snapshot.fields.trust).toBeNull();
    expect(snapshot.fields.intent).toBeNull();
    expect(snapshot.lockedLevels).toEqual(['L2', 'L3', 'L4']);
  });

  it('reveals fields up to mutual openness', () => {
    const snapshot = buildProfileSnapshot({
      profileId: 'target-2',
      viewerLevel: 'L3',
      targetLevel: 'L4',
      fields,
      progress: {
        current: 'L4',
        next: null,
        percent: 100,
        requiredActions: [],
      },
    });

    expect(snapshot.reciprocalLevel).toBe('L3');
    expect(snapshot.fields.vibe).toEqual(fields.vibe);
    expect(snapshot.fields.trust).toEqual(fields.trust);
    expect(snapshot.fields.intent).toBeNull();
    expect(snapshot.lockedLevels).toEqual(['L4']);
  });
});
