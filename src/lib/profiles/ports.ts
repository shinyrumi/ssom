import type { Profile, UpsertProfileInput } from './types';

export interface ProfileRepository {
  getProfile(userId: string): Promise<Profile | null>;
  upsertProfile(input: UpsertProfileInput): Promise<Profile>;
}
