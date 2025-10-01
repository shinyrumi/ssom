'use client';

import { useMemo } from 'react';
import type { CommentNode } from '@/lib/comments';
import type { MutualLikeBanner } from '@/lib/reactions';
import type { Thread } from '@/lib/threads';
import { cn } from '@/lib/utils';

export type FeedThreadProps = {
  data: {
    thread: Thread | null;
    comments: CommentNode[];
    mutualLikeBanner: MutualLikeBanner | null;
  };
};

export const FeedThread = ({ data }: FeedThreadProps) => {
  const isEmpty = useMemo(() => !data.thread, [data.thread]);

  if (isEmpty) {
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
        <h1 className="mt-3 text-2xl font-semibold text-neutral-50">{data.thread?.title}</h1>
        <p className="mt-4 text-neutral-200">{data.thread?.body}</p>
      </article>

      {data.mutualLikeBanner ? (
        <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          서로 마음이 통했어요! 조금 더 솔직한 이야기를 나눠볼까요?
        </div>
      ) : null}

      <div className="space-y-3">
        {data.comments.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-neutral-800 p-6 text-sm text-neutral-400">
            아직 댓글이 없어요. 첫 번째 이야기의 주인공이 되어 주세요.
          </p>
        ) : (
          data.comments.map((comment) => (
            <CommentNodeItem key={comment.id} node={comment} depth={0} />
          ))
        )}
      </div>
    </section>
  );
};

type CommentNodeItemProps = {
  node: CommentNode;
  depth: number;
};

const CommentNodeItem = ({ node, depth }: CommentNodeItemProps) => {
  const indentClass = depth > 0 ? `pl-${Math.min(depth, 3) * 4}` : '';

  return (
    <div className={cn('space-y-3', indentClass)}>
      <article className="rounded-3xl bg-neutral-900 p-4 text-sm shadow-inner shadow-black/15">
        <header className="mb-2 flex items-center justify-between text-neutral-400">
          <span className="font-semibold text-neutral-300">익명</span>
          <span className="text-xs">{new Date(node.createdAt).toLocaleTimeString()}</span>
        </header>
        <p className="leading-relaxed text-neutral-200">{node.content}</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-3 py-1"
          >
            ❤️ {node.heartCount}
          </button>
          <button type="button" className="text-neutral-500">
            답글 달기
          </button>
        </div>
      </article>

      {node.replies.length > 0 && (
        <div className="space-y-3 border-l border-neutral-800 pl-4">
          {node.replies.map((reply) => (
            <CommentNodeItem key={reply.id} node={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
