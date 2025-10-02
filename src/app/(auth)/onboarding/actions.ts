'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/adapters/supabase/server-client';
import { createSupabaseProfileRepository } from '@/lib/adapters/supabase/profile-repository';
import { createProfileService } from '@/lib/profiles';

export async function saveProfileAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  const profileRepo = createSupabaseProfileRepository({
    getClient: async () => supabase,
  });
  const profileService = createProfileService({ profileRepo });

  try {
    await profileService.upsertProfile({
      userId: user.id,
      nickname,
      avatarPreset,
    });
  } catch (error) {
    console.error('saveProfileAction error', error);
    return { success: false, error: 'SERVER_ERROR' } as const;
  }

  revalidatePath('/');
  redirect('/');
}
