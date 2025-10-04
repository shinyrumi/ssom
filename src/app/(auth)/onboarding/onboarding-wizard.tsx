'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile, ProfileLevel } from '@/lib/profiles';
import { OnboardingForm } from './onboarding-form';
import { VibeStep } from './vibe-step';
import type { Level } from '@/lib/levels';

const STEPS: Array<{ key: Level; label: string; description: string; interactive: boolean }> = [
  { key: 'L1', label: '기본', description: '닉네임 · 아바타', interactive: true },
  { key: 'L2', label: '바이브', description: '상태 메시지 · 취향', interactive: true },
  { key: 'L3', label: '신뢰', description: '사진/음성 인증 (준비 중)', interactive: false },
  { key: 'L4', label: '의도', description: '학력·관심도 (준비 중)', interactive: false },
];

export function OnboardingWizard({
  initialStep,
  profile,
  vibeLevel,
}: {
  initialStep: number;
  profile: Profile | null;
  vibeLevel: ProfileLevel | null;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);

  const completedSteps = useMemo(() => {
    const completeL1 = Boolean(profile && profile.nickname && profile.avatarPreset);
    const completeL2 = Boolean(vibeLevel && Object.keys(vibeLevel.data ?? {}).length > 0);
    return {
      L1: completeL1,
      L2: completeL2,
    };
  }, [profile, vibeLevel]);

  const goToNext = () => {
    if (currentStep + 1 < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/');
    }
  };

  const finishOnboarding = () => {
    router.replace('/');
  };

  const step = STEPS[currentStep];
  const content = renderStep({
    step,
    goToNext,
    profile,
    vibeLevel,
    finishOnboarding,
  });

  return (
    <section className="space-y-10">
      <StepIndicator currentStep={currentStep} completed={completedSteps} />
      {content}
    </section>
  );
}

type RenderStepArgs = {
  step: (typeof STEPS)[number];
  goToNext: () => void;
  profile: Profile | null;
  vibeLevel: ProfileLevel | null;
  finishOnboarding: () => void;
};

function renderStep({ step, goToNext, profile, vibeLevel, finishOnboarding }: RenderStepArgs) {
  if (!step.interactive) {
    return (
      <div className="space-y-4 rounded-3xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">
        <h2 className="text-lg font-semibold text-neutral-100">{step.label} 단계</h2>
        <p>{step.description}</p>
        <p>이 단계는 곧 공개될 예정입니다. 조금만 기다려 주세요!</p>
        <button
          type="button"
          className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
          onClick={finishOnboarding}
        >
          홈으로 이동
        </button>
      </div>
    );
  }

  if (step.key === 'L1') {
    return (
      <OnboardingForm
        defaultNickname={profile?.nickname}
        defaultAvatar={profile?.avatarPreset}
        onSuccess={goToNext}
      />
    );
  }

  if (step.key === 'L2') {
    const data = (vibeLevel?.data ?? {}) as { status?: string; tags?: string[] };
    return (
      <VibeStep
        defaultStatus={data.status as string | undefined}
        defaultTags={(data.tags as string[]) ?? []}
        onSuccess={goToNext}
      />
    );
  }

  return null;
}

type StepIndicatorProps = {
  currentStep: number;
  completed: { L1: boolean; L2: boolean };
};

function StepIndicator({ currentStep, completed }: StepIndicatorProps) {
  return (
    <ol className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
      {STEPS.map((step, index) => {
        const isActive = index === currentStep;
        const isDone = (step.key === 'L1' && completed.L1) || (step.key === 'L2' && completed.L2);
        return (
          <li
            key={step.key}
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1 ring-1 ring-transparent transition-colors',
              isActive ? 'bg-rose-500/20 text-rose-200 ring-rose-500/50' : undefined,
              !isActive && isDone ? 'text-emerald-300' : undefined,
            )}
          >
            <span>{step.label}</span>
            <span className="hidden text-neutral-400 sm:inline">{step.description}</span>
          </li>
        );
      })}
    </ol>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}
