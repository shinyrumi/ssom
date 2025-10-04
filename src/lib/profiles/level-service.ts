import type { ProfileLevelRepository } from './ports';
import type { Level } from '@/lib/levels';
import type { ProfileLevel } from './types';

export type ProfileLevelServiceDependencies = {
  profileLevelRepo: ProfileLevelRepository;
};

export type ProfileLevelService = {
  getProfileLevel: (profileId: string, level: Level) => Promise<ProfileLevel | null>;
  upsertProfileLevel: (params: { profileId: string; level: Level; data: Record<string, unknown> }) => Promise<ProfileLevel>;
  isLevelComplete: (level: ProfileLevel | null) => boolean;
};

export const createProfileLevelService = (
  deps: ProfileLevelServiceDependencies,
): ProfileLevelService => ({
  async getProfileLevel(profileId, level) {
    return deps.profileLevelRepo.getProfileLevel(profileId, level);
  },
  async upsertProfileLevel(params) {
    return deps.profileLevelRepo.upsertProfileLevel(params);
  },
  isLevelComplete(level) {
    if (!level) {
      return false;
    }
    return Object.keys(level.data ?? {}).length > 0;
  },
});
