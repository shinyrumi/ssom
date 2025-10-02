import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './server-client';
import type { Profile, ProfileRepository } from '@/lib/profiles';
import type { Level } from '@/lib/levels';

type ProfileRow = {
  id: string;
  nickname: string;
  avatar_preset: string;
  current_level: Level;
  created_at: string;
  updated_at: string;
};

type RepositoryOptions = {
  getClient?: () => Promise<SupabaseClient>;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    nickname: row.nickname,
    avatarPreset: row.avatar_preset,
    currentLevel: row.current_level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const createSupabaseProfileRepository = (
  options?: RepositoryOptions,
): ProfileRepository => {
  const getClient = options?.getClient ?? createSupabaseServerClient;

  return {
    async getProfile(userId) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_preset, current_level, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle<ProfileRow>();

      if (error) {
        console.error('getProfile error', error.message);
        return null;
      }

      return data ? mapProfile(data) : null;
    },

    async upsertProfile(input) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: input.userId,
            nickname: input.nickname,
            avatar_preset: input.avatarPreset,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )
        .select('id, nickname, avatar_preset, current_level, created_at, updated_at')
        .maybeSingle<ProfileRow>();

      if (error || !data) {
        throw new Error(error?.message ?? '프로필 저장에 실패했습니다.');
      }

      return mapProfile(data);
    },
  };
};
