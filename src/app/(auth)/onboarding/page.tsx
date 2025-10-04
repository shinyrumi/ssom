import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/adapters/supabase/admin-client';
import { createSupabaseServerClient } from '@/lib/adapters/supabase/server-client';
import { createSupabaseProfileLevelRepository } from '@/lib/adapters/supabase/profile-level-repository';
import { createSupabaseProfileRepository } from '@/lib/adapters/supabase/profile-repository';
import { createProfileLevelService, createProfileService } from '@/lib/profiles';
import { OnboardingWizard } from './onboarding-wizard';

const FALLBACK_PROFILE_ID =
  process.env.SUPABASE_DEMO_PROFILE_ID ?? process.env.NEXT_PUBLIC_SUPABASE_DEMO_PROFILE_ID ?? null;

function resolveUserId(userId: string | null | undefined) {
  return userId ?? FALLBACK_PROFILE_ID;
}

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedUserId = resolveUserId(user?.id);
  if (!resolvedUserId) {
    redirect('/');
  }

  const readClient = user ? supabase : createSupabaseAdminClient();

  const profileRepo = createSupabaseProfileRepository({
    getClient: async () => readClient,
  });
  const profileLevelRepo = createSupabaseProfileLevelRepository({
    getClient: async () => readClient,
  });

  const profileService = createProfileService({ profileRepo });
  const profileLevelService = createProfileLevelService({ profileLevelRepo });

  const profile = await profileService.getProfile(resolvedUserId);
  const vibeLevel = await profileLevelService.getProfileLevel(resolvedUserId, 'L2');

  const basicComplete = profileService.isComplete(profile);
  const vibeComplete = profileLevelService.isLevelComplete(vibeLevel);

  if (basicComplete && vibeComplete) {
    redirect('/');
  }

  const initialStep = basicComplete ? 1 : 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-screen-sm flex-col gap-10 bg-neutral-950 px-4 pb-16 pt-16 text-neutral-50">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">THE SSOM</p>
        <h1 className="text-3xl font-semibold">나만의 프로필 작성</h1>
        <p className="text-sm text-neutral-400">
          마음을 열기 전, 단계별 온보딩으로 나를 소개해 보세요.
        </p>
      </header>

      <OnboardingWizard initialStep={initialStep} profile={profile} vibeLevel={vibeLevel} />
    </main>
  );
}
