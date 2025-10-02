import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/adapters/supabase/server-client';
import { createSupabaseProfileRepository } from '@/lib/adapters/supabase/profile-repository';
import { createProfileService } from '@/lib/profiles';
import { OnboardingForm } from './onboarding-form';

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const profileRepo = createSupabaseProfileRepository({
    getClient: async () => supabase,
  });
  const profileService = createProfileService({ profileRepo });
  const profile = await profileService.getProfile(user.id);

  if (profileService.isComplete(profile)) {
    redirect('/');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-screen-sm flex-col gap-10 bg-neutral-950 px-4 pb-16 pt-16 text-neutral-50">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">THE SSOM</p>
        <h1 className="text-3xl font-semibold">나만의 프로필 작성</h1>
        <p className="text-sm text-neutral-400">
          마음을 열기 전, 닉네임과 아바타로 나의 첫인상을 만들어 볼까요?
        </p>
      </header>

      <OnboardingForm
        defaultNickname={profile?.nickname}
        defaultAvatar={profile?.avatarPreset}
      />
    </main>
  );
}
