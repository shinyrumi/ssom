import type { Profile, ProfileLevel, UpsertProfileInput } from './types';
import type { Level } from '@/lib/levels';

export interface ProfileRepository {
  getProfile(userId: string): Promise<Profile | null>;
  upsertProfile(input: UpsertProfileInput): Promise<Profile>;
}

export interface ProfileLevelRepository {
  getProfileLevel(profileId: string, level: Level): Promise<ProfileLevel | null>;
  upsertProfileLevel(params: { profileId: string; level: Level; data: Record<string, unknown> }): Promise<ProfileLevel>;
}
