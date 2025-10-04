import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './server-client';
import type { ProfileLevelRepository } from '@/lib/profiles';
import type { Level } from '@/lib/levels';
import type { ProfileLevel } from '@/lib/profiles';

type ProfileLevelRow = {
  profile_id: string;
  level: Level;
  data: Record<string, unknown>;
  unlocked_at: string;
};

type RepositoryOptions = {
  getClient?: () => Promise<SupabaseClient>;
};

function mapProfileLevel(row: ProfileLevelRow): ProfileLevel {
  return {
    profileId: row.profile_id,
    level: row.level,
    data: row.data ?? {},
    unlockedAt: row.unlocked_at,
  };
}

export const createSupabaseProfileLevelRepository = (
  options?: RepositoryOptions,
): ProfileLevelRepository => {
  const getClient = options?.getClient ?? createSupabaseServerClient;

  return {
    async getProfileLevel(profileId, level) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('profile_levels')
        .select('profile_id, level, data, unlocked_at')
        .eq('profile_id', profileId)
        .eq('level', level)
        .maybeSingle<ProfileLevelRow>();

      if (error) {
        console.error('getProfileLevel error', error.message);
        return null;
      }

      return data ? mapProfileLevel(data) : null;
    },

    async upsertProfileLevel(params) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('profile_levels')
        .upsert(
          {
            profile_id: params.profileId,
            level: params.level,
            data: params.data,
          },
          { onConflict: 'profile_id,level' },
        )
        .select('profile_id, level, data, unlocked_at')
        .maybeSingle<ProfileLevelRow>();

      if (error || !data) {
        throw new Error(error?.message ?? '프로필 레벨 저장에 실패했습니다.');
      }

      return mapProfileLevel(data);
    },
  };
};
