'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { saveProfileAction } from './actions';

const AVATAR_PRESETS = ['aurora', 'sunset', 'forest', 'neon', 'wave'];

type FormState = {
  nickname: string;
  avatarPreset: string;
  error: string | null;
  isPending: boolean;
  startTransition: ReturnType<typeof useTransition>[1];
  setNickname: (value: string) => void;
  setAvatarPreset: (value: string) => void;
  setError: (value: string | null) => void;
};

export function OnboardingForm({
  defaultNickname,
  defaultAvatar,
}: {
  defaultNickname?: string;
  defaultAvatar?: string;
}) {
  const [nickname, setNickname] = useState(defaultNickname ?? '');
  const [avatarPreset, setAvatarPreset] = useState(defaultAvatar ?? AVATAR_PRESETS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formState: FormState = useMemo(
    () => ({ nickname, avatarPreset, error, isPending, startTransition, setNickname, setAvatarPreset, setError }),
    [avatarPreset, error, isPending, nickname, startTransition],
  );

  const handleSubmit = useSubmitHandler(formState);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <NicknameField state={formState} />
      <AvatarSelector state={formState} />
      <SubmitButton isPending={isPending} />
      {error ? <p className="text-center text-sm text-rose-400">{error}</p> : null}
    </form>
  );
}

function useSubmitHandler(state: FormState) {
  return useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData();
      formData.append('nickname', state.nickname);
      formData.append('avatarPreset', state.avatarPreset);

      state.startTransition(async () => {
        const result = await saveProfileAction(formData);
        if (result?.error) {
          state.setError(resolveErrorMessage(result.error));
        }
      });
    },
    [state],
  );
}

function NicknameField({ state }: { state: FormState }) {
  return (
    <section className="space-y-3">
      <label className="block text-sm font-semibold text-neutral-200" htmlFor="nickname">
        닉네임
      </label>
      <input
        id="nickname"
        name="nickname"
        value={state.nickname}
        onChange={(event) => state.setNickname(event.target.value)}
        placeholder="나를 표현하는 닉네임을 입력하세요"
        className="w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-neutral-100 outline-none ring-1 ring-neutral-800 focus:ring-rose-500"
        maxLength={20}
        disabled={state.isPending}
      />
      <p className="text-xs text-neutral-500">공백 포함 20자 이내 • 욕설/개인정보는 삼가해주세요</p>
    </section>
  );
}

function AvatarSelector({ state }: { state: FormState }) {
  return (
    <section className="space-y-3">
      <p className="text-sm font-semibold text-neutral-200">아바타 무드</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {AVATAR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => state.setAvatarPreset(preset)}
            className={getAvatarButtonClasses(state.avatarPreset === preset)}
            disabled={state.isPending}
          >
            <span className="text-lg">{getAvatarEmoji(preset)}</span>
            <span className="text-xs font-semibold capitalize">{preset}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      className="w-full rounded-full bg-rose-500 py-3 text-sm font-semibold text-white disabled:opacity-60"
      disabled={isPending}
    >
      {isPending ? '저장 중...' : '시작하기'}
    </button>
  );
}

function resolveErrorMessage(code: string): string {
  switch (code) {
    case 'UNAUTHENTICATED':
      return '로그인이 필요합니다.';
    case 'EMPTY_NICKNAME':
      return '닉네임을 입력해 주세요.';
    case 'EMPTY_AVATAR':
      return '아바타를 선택해 주세요.';
    case 'SERVER_ERROR':
      return '프로필 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    default:
      return '알 수 없는 오류가 발생했습니다.';
  }
}

function getAvatarButtonClasses(isActive: boolean) {
  return cn(
    'flex flex-col items-center gap-1 rounded-2xl border px-4 py-3 transition-colors',
    isActive
      ? 'border-rose-500/70 bg-rose-500/10 text-rose-200'
      : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-rose-500/40 hover:text-rose-200',
  );
}

function getAvatarEmoji(preset: string): string {
  switch (preset) {
    case 'sunset':
      return '🌇';
    case 'aurora':
      return '🌌';
    case 'forest':
      return '🌿';
    case 'neon':
      return '🌈';
    case 'wave':
      return '🌊';
    default:
      return '✨';
  }
}
