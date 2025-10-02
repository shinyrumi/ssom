import type { ProfileRepository } from './ports';
import type { Profile, UpsertProfileInput } from './types';

export type ProfileServiceDependencies = {
  profileRepo: ProfileRepository;
};

export type ProfileService = {
  getProfile: (userId: string) => Promise<Profile | null>;
  upsertProfile: (input: UpsertProfileInput) => Promise<Profile>;
  isComplete: (profile: Profile | null) => boolean;
};

export const createProfileService = (deps: ProfileServiceDependencies): ProfileService => ({
  async getProfile(userId) {
    return deps.profileRepo.getProfile(userId);
  },
  async upsertProfile(input) {
    return deps.profileRepo.upsertProfile(input);
  },
  isComplete(profile) {
    if (!profile) {
      return false;
    }
    return Boolean(profile.nickname.trim() && profile.avatarPreset.trim());
  },
});
