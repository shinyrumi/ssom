import { Level, ProfileSnapshot, UnlockAttempt, UnlockResult } from './types';

export type ProfileLevelRecord = {
  profileId: string;
  level: Level;
  data: Record<string, unknown>;
  unlockedAt: string;
};

export interface LevelRepository {
  getProfileLevel(profileId: string): Promise<Level>;
  getProfileLevels(profileId: string): Promise<ProfileLevelRecord[]>;
  saveUnlock(result: UnlockResult, attempt: UnlockAttempt): Promise<void>;
}

export interface ViewRepository {
  recordView(params: {
    viewerId: string;
    targetId: string;
    levelExposed: Level;
  }): Promise<void>;
}

export interface ProgressRepository {
  getProgress(profileId: string): Promise<{ xp: number; thresholds: Record<Level, number> }>;
}

export type LevelServiceDependencies = {
  levelRepo: LevelRepository;
  viewRepo: ViewRepository;
  progressRepo: ProgressRepository;
};

export type LevelServiceAPI = {
  unlock: (attempt: UnlockAttempt) => Promise<UnlockResult>;
  viewSnapshot: (params: {
    profileId: string;
    viewerId: string;
    targetId: string;
  }) => Promise<ProfileSnapshot>;
};
