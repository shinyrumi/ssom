'use client';

import { useState, useTransition } from 'react';

type CommentComposerProps = {
  onSubmit: (content: string, parentId?: string | null) => Promise<void>;
  parentId?: string | null;
  placeholder?: string;
  onCancel?: () => void;
};

type ComposerState = {
  message: string;
  setMessage: (value: string) => void;
  error: string | null;
  setError: (value: string | null) => void;
  isPending: boolean;
  startTransition: ReturnType<typeof useTransition>[1];
};

export const CommentComposer = ({ onSubmit, parentId = null, placeholder, onCancel }: CommentComposerProps) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const state: ComposerState = { message, setMessage, error, setError, isPending, startTransition };
  const handleSubmit = createSubmitHandler({ state, onSubmit, parentId, onCancel });

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-neutral-900 p-4 shadow-inner shadow-black/20">
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder={placeholder ?? '오늘의 질문에 답해 보세요'}
        className="w-full resize-none rounded-2xl bg-neutral-950/60 p-3 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-rose-500"
        rows={parentId ? 2 : 3}
        disabled={isPending}
      />
      <ComposerActions
        error={error}
        isPending={isPending}
        parentId={parentId}
        onCancel={onCancel}
      />
    </form>
  );
};

type SubmitHandlerArgs = {
  state: ComposerState;
  onSubmit: (content: string, parentId?: string | null) => Promise<void>;
  parentId: string | null;
  onCancel?: () => void;
};

function createSubmitHandler({ state, onSubmit, parentId, onCancel }: SubmitHandlerArgs) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    state.startTransition(async () => {
      try {
        await onSubmit(state.message, parentId);
        state.setMessage('');
        state.setError(null);
        onCancel?.();
      } catch (submissionError) {
        state.setError(resolveComposerError(submissionError));
      }
    });
  };
}

type ComposerActionsProps = {
  error: string | null;
  isPending: boolean;
  parentId: string | null;
  onCancel?: () => void;
};

function ComposerActions({ error, isPending, parentId, onCancel }: ComposerActionsProps) {
  return (
    <div className="mt-2 flex items-center justify-between">
      <span className="text-xs text-rose-400/80">{error}</span>
      <div className="flex items-center gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300"
            disabled={isPending}
          >
            취소
          </button>
        ) : null}
        <button
          type="submit"
          className="rounded-full bg-rose-500 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? '작성 중...' : parentId ? '답글 남기기' : '댓글 남기기'}
        </button>
      </div>
    </div>
  );
}

function resolveComposerError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === 'EMPTY_CONTENT') {
      return '내용을 입력해 주세요.';
    }
    if (error.message === 'AUTHOR_ID_MISSING' || error.message === 'THREAD_MISSING') {
      return '댓글을 작성할 수 없습니다. 로그인 또는 새로고침 후 다시 시도해 주세요.';
    }
  }
  return '댓글 작성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}
