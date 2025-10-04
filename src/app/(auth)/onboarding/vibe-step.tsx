'use client';

import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { saveProfileLevelAction } from './actions';

const VIBE_TAGS = ['커피', '전시', '드라이브', '게임', '요리', '산책'];

export function VibeStep({
  defaultStatus,
  defaultTags,
  onSuccess,
}: {
  defaultStatus?: string;
  defaultTags?: string[];
  onSuccess: () => void;
}) {
  const controller = useVibeController({ defaultStatus, defaultTags, onSuccess });

  return (
    <form onSubmit={controller.handleSubmit} className="space-y-6">
      <VibeStatusField value={controller.status} onChange={controller.setStatus} disabled={controller.isPending} />
      <VibeTagSelector selected={controller.selectedTags} onToggle={controller.toggleTag} disabled={controller.isPending} />
      <button
        type="submit"
        className="w-full rounded-full bg-rose-500 py-3 text-sm font-semibold text-white disabled:opacity-60"
        disabled={controller.isPending}
      >
        {controller.isPending ? '저장 중...' : '다음 단계로'}
      </button>
      {controller.error ? <p className="text-center text-sm text-rose-400">{controller.error}</p> : null}
    </form>
  );
}

type VibeControllerParams = {
  defaultStatus?: string;
  defaultTags?: string[];
  onSuccess: () => void;
};

function useVibeController(params: VibeControllerParams) {
  const [status, setStatus] = useState(params.defaultStatus ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>(params.defaultTags ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setPending] = useState(false);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((item) => item !== tag);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, tag];
    });
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setPending(true);

      const payload = JSON.stringify({ status: status.trim(), tags: selectedTags });
      const formData = new FormData();
      formData.append('level', 'L2');
      formData.append('payload', payload);

      const result = await saveProfileLevelAction(formData);
      setPending(false);

      if (result?.error) {
        setError(resolveErrorMessage(result.error));
        return;
      }

      setError(null);
      params.onSuccess();
    },
    [params, selectedTags, status],
  );

  return {
    status,
    setStatus,
    selectedTags,
    toggleTag,
    isPending,
    error,
    handleSubmit,
  };
}

function VibeStatusField({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  return (
    <section className="space-y-2">
      <label className="block text-sm font-semibold text-neutral-200" htmlFor="status">
        지금 내 바이브
      </label>
      <textarea
        id="status"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="예: 새로운 전시를 찾아다니는 중!"
        className="w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-neutral-100 outline-none ring-1 ring-neutral-800 focus:ring-rose-500"
        rows={3}
        disabled={disabled}
      />
      <p className="text-xs text-neutral-500">간단한 상태 메시지로 분위기를 전해 주세요.</p>
    </section>
  );
}

function VibeTagSelector({
  selected,
  onToggle,
  disabled,
}: {
  selected: string[];
  onToggle: (tag: string) => void;
  disabled: boolean;
}) {
  return (
    <section className="space-y-2">
      <p className="text-sm font-semibold text-neutral-200">취향 키워드</p>
      <div className="flex flex-wrap gap-2">
        {VIBE_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              selected.includes(tag)
                ? 'border-rose-500/60 bg-rose-500/10 text-rose-200'
                : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-rose-500/40 hover:text-rose-200',
            )}
            disabled={disabled}
          >
            #{tag}
          </button>
        ))}
      </div>
      <p className="text-xs text-neutral-500">최대 3개까지 선택할 수 있어요.</p>
    </section>
  );
}

function resolveErrorMessage(code: string): string {
  switch (code) {
    case 'UNAUTHENTICATED':
      return '로그인이 필요합니다.';
    case 'LEVEL_MISSING':
      return '레벨 정보가 누락되었습니다.';
    case 'INVALID_PAYLOAD':
      return '입력값을 다시 확인해 주세요.';
    case 'SERVER_ERROR':
      return '저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    default:
      return '알 수 없는 오류가 발생했습니다.';
  }
}
