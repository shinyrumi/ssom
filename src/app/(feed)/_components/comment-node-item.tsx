'use client';

import { useTransition } from 'react';
import type { CommentNode } from '@/lib/comments';
import { commentDepthPadding } from '@/lib/comments/tree-ops';
import { cn } from '@/lib/utils';

type CommentNodeItemProps = {
  node: CommentNode;
  depth: number;
  onToggleHeart: (commentId: string) => Promise<void>;
};

type CommentCardProps = {
  node: CommentNode;
  pending: boolean;
  onToggleHeart: () => void;
};

type CommentActionsProps = {
  heartCount: number;
  viewerHasHearted: boolean;
  onToggleHeart: () => void;
  pending: boolean;
};

export const CommentNodeItem = ({ node, depth, onToggleHeart }: CommentNodeItemProps) => {
  const [isPending, startTransition] = useTransition();
  const paddingClass = commentDepthPadding[Math.min(depth, commentDepthPadding.length - 1)];

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await onToggleHeart(node.id);
      } catch (error) {
        console.error('toggleHeart error', error);
      }
    });
  };

  return (
    <div className={cn('space-y-3', paddingClass)}>
      <CommentCard node={node} pending={isPending} onToggleHeart={handleToggle} />

      {node.replies.length > 0 && (
        <div className="space-y-3 border-l border-neutral-800 pl-4">
          {node.replies.map((reply) => (
            <CommentNodeItem key={reply.id} node={reply} depth={depth + 1} onToggleHeart={onToggleHeart} />
          ))}
        </div>
      )}
    </div>
  );
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
