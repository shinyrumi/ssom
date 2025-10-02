'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { CommentNode } from '@/lib/comments';
import type { MutualLikeBanner } from '@/lib/reactions';
import type { Thread } from '@/lib/threads';
import { cn } from '@/lib/utils';
import { submitCommentAction, toggleHeartAction } from '../actions';

export type FeedThreadProps = {
  data: {
    thread: Thread | null;
    comments: CommentNode[];
    mutualLikeBanner: MutualLikeBanner | null;
  };
};

export const FeedThread = ({ data }: FeedThreadProps) => {
  const router = useRouter();
  const isEmpty = useMemo(() => !data.thread, [data.thread]);

  if (isEmpty || !data.thread) {
    return (
      <section className="grid min-h-[60vh] place-content-center text-center text-neutral-400">
        아직 등록된 질문이 없습니다.
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <article className="rounded-3xl bg-neutral-900 p-6 shadow-lg shadow-black/40">
        <p className="text-sm uppercase tracking-widest text-neutral-500">오늘의 질문</p>
        <h1 className="mt-3 text-2xl font-semibold text-neutral-50">{data.thread.title}</h1>
        <p className="mt-4 text-neutral-200">{data.thread.body}</p>
      </article>

      {data.mutualLikeBanner ? (
        <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          서로 마음이 통했어요! 조금 더 솔직한 이야기를 나눠볼까요?
        </div>
      ) : null}

      <CommentComposer threadId={data.thread.id} onSuccess={() => router.refresh()} />

      <div className="space-y-3">
        {data.comments.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-neutral-800 p-6 text-sm text-neutral-400">
            아직 댓글이 없어요. 첫 번째 이야기의 주인공이 되어 주세요.
          </p>
        ) : (
          data.comments.map((comment) => (
            <CommentNodeItem key={comment.id} node={comment} depth={0} onRefresh={() => router.refresh()} />
          ))
        )}
      </div>
    </section>
  );
};

type CommentComposerProps = {
  threadId: string;
  onSuccess: () => void;
};

const CommentComposer = ({ threadId, onSuccess }: CommentComposerProps) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) {
      setError('내용을 입력해 주세요.');
      return;
    }
    startTransition(async () => {
      const result = await submitCommentAction({ threadId, content: message });
      if (result.success) {
        setMessage('');
        setError(null);
        onSuccess();
      } else if (result.error === 'AUTHOR_ID_MISSING') {
        setError('댓글 작성자 정보를 찾을 수 없습니다. 로그인 후 다시 시도해 주세요.');
      } else if (result.error === 'EMPTY_CONTENT') {
        setError('내용을 입력해 주세요.');
      } else {
        setError('댓글 작성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
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

type CommentNodeItemProps = {
  node: CommentNode;
  depth: number;
  onRefresh: () => void;
};

const depthPaddingClass = ['pl-0', 'pl-4', 'pl-8', 'pl-12'];

const CommentNodeItem = ({ node, depth, onRefresh }: CommentNodeItemProps) => {
  const [isPending, startTransition] = useTransition();
  const paddingClass = depthPaddingClass[Math.min(depth, depthPaddingClass.length - 1)];
  const handleToggleHeart = () =>
    startTransition(async () => {
      await toggleHeartAction({ commentId: node.id });
      onRefresh();
    });

  return (
    <div className={cn('space-y-3', paddingClass)}>
      <CommentCard node={node} pending={isPending} onToggleHeart={handleToggleHeart} />
      {node.replies.length > 0 && (
        <div className="space-y-3 border-l border-neutral-800 pl-4">
          {node.replies.map((reply) => (
            <CommentNodeItem key={reply.id} node={reply} depth={depth + 1} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
};

type CommentCardProps = {
  node: CommentNode;
  pending: boolean;
  onToggleHeart: () => void;
};

const CommentCard = ({ node, pending, onToggleHeart }: CommentCardProps) => (
  <article className="rounded-3xl bg-neutral-900 p-4 text-sm shadow-inner shadow-black/15">
    <header className="mb-2 flex items-center justify-between text-neutral-400">
      <span className="font-semibold text-neutral-300">익명</span>
      <span className="text-xs">
        {new Intl.DateTimeFormat('ko', { hour: '2-digit', minute: '2-digit' }).format(new Date(node.createdAt))}
      </span>
    </header>
    <p className="leading-relaxed text-neutral-200">{node.content}</p>
    <CommentActions
      heartCount={node.heartCount}
      viewerHasHearted={node.viewerHasHearted}
      onToggleHeart={onToggleHeart}
      pending={pending}
    />
  </article>
);

type CommentActionsProps = {
  heartCount: number;
  viewerHasHearted: boolean;
  onToggleHeart: () => void;
  pending: boolean;
};

const CommentActions = ({ heartCount, viewerHasHearted, onToggleHeart, pending }: CommentActionsProps) => (
  <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400">
    <button
      type="button"
      onClick={onToggleHeart}
      disabled={pending}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 transition-colors',
        viewerHasHearted ? 'bg-rose-500 text-white' : 'bg-neutral-800 text-neutral-300',
        pending && 'opacity-70',
      )}
    >
      ❤️ {heartCount}
    </button>
    <button type="button" className="text-neutral-500" disabled>
      답글 달기
    </button>
  </div>
);
