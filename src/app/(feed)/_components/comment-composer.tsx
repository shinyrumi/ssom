'use client';

import { useState, useTransition } from 'react';

type CommentComposerProps = {
  onSubmit: (content: string) => Promise<void>;
};

export const CommentComposer = ({ onSubmit }: CommentComposerProps) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        await onSubmit(message);
        setMessage('');
        setError(null);
      } catch (submissionError) {
        setError(resolveComposerError(submissionError));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-neutral-900 p-4 shadow-inner shadow-black/20">
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="오늘의 질문에 답해 보세요"
        className="w-full resize-none rounded-2xl bg-neutral-950/60 p-3 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-rose-500"
        rows={3}
        disabled={isPending}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-rose-400/80">{error}</span>
        <button
          type="submit"
          className="rounded-full bg-rose-500 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? '작성 중...' : '댓글 남기기'}
        </button>
      </div>
    </form>
  );
};

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
