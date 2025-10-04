'use server';

import { createSupabaseAdminClient } from '@/lib/adapters/supabase/admin-client';
import { createSupabaseServerClient } from '@/lib/adapters/supabase/server-client';
import { createSupabaseProfileLevelRepository } from '@/lib/adapters/supabase/profile-level-repository';
import { createSupabaseProfileRepository } from '@/lib/adapters/supabase/profile-repository';
import { createProfileLevelService, createProfileService } from '@/lib/profiles';
import type { Level } from '@/lib/levels';

const FALLBACK_PROFILE_ID =
  process.env.SUPABASE_DEMO_PROFILE_ID ?? process.env.NEXT_PUBLIC_SUPABASE_DEMO_PROFILE_ID ?? null;

function resolveUserId(userId: string | null | undefined) {
  return userId ?? FALLBACK_PROFILE_ID;
}

function isValidLevel(value: string): value is Level {
  return ['L1', 'L2', 'L3', 'L4'].includes(value);
}

export async function saveProfileAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedUserId = resolveUserId(user?.id);
  if (!resolvedUserId) {
    return { success: false, error: 'UNAUTHENTICATED' } as const;
  }

  const nickname = String(formData.get('nickname') ?? '').trim();
  const avatarPreset = String(formData.get('avatarPreset') ?? '').trim();

  if (!nickname) {
    return { success: false, error: 'EMPTY_NICKNAME' } as const;
  }
  if (!avatarPreset) {
    return { success: false, error: 'EMPTY_AVATAR' } as const;
  }

  const clientForWrite = user ? supabase : createSupabaseAdminClient();

  const profileRepo = createSupabaseProfileRepository({
    getClient: async () => clientForWrite,
  });
  const profileService = createProfileService({ profileRepo });

  try {
    await profileService.upsertProfile({
      userId: resolvedUserId,
      nickname,
      avatarPreset,
    });
    return { success: true } as const;
  } catch (error) {
    console.error('saveProfileAction error', error);
    return { success: false, error: 'SERVER_ERROR' } as const;
  }
}

export async function saveProfileLevelAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedUserId = resolveUserId(user?.id);
  if (!resolvedUserId) {
    return { success: false, error: 'UNAUTHENTICATED' } as const;
  }

  const levelRaw = String(formData.get('level') ?? '').trim();
  if (!isValidLevel(levelRaw)) {
    return { success: false, error: 'LEVEL_MISSING' } as const;
  }

  const payloadRaw = String(formData.get('payload') ?? '');
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(payloadRaw || '{}');
  } catch (error) {
    console.error('saveProfileLevelAction parse error', error);
    return { success: false, error: 'INVALID_PAYLOAD' } as const;
  }

  const clientForWrite = user ? supabase : createSupabaseAdminClient();

  const profileLevelRepo = createSupabaseProfileLevelRepository({
    getClient: async () => clientForWrite,
  });
  const profileLevelService = createProfileLevelService({ profileLevelRepo });

  try {
    await profileLevelService.upsertProfileLevel({
      profileId: resolvedUserId,
      level: levelRaw,
      data,
    });
    return { success: true } as const;
  } catch (error) {
    console.error('saveProfileLevelAction error', error);
    return { success: false, error: 'SERVER_ERROR' } as const;
  }
}
