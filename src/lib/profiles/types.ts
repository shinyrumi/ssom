import type { Level } from '@/lib/levels';

export type Profile = {
  id: string;
  nickname: string;
  avatarPreset: string;
  currentLevel: Level;
  createdAt: string;
  updatedAt: string;
};

export type UpsertProfileInput = {
  userId: string;
  nickname: string;
  avatarPreset: string;
};

export type ProfileDraft = {
  nickname: string;
  avatarPreset: string;
};

export type ProfileLevel = {
  profileId: string;
  level: Level;
  data: Record<string, unknown>;
  unlockedAt: string;
};
