'use client';

import { useCallback, useMemo, useTransition } from 'react';
import type { CommentNode } from '@/lib/comments';
import { commentDepthPadding } from '@/lib/comments/tree-ops';
import { cn } from '@/lib/utils';
import { CommentComposer } from './comment-composer';

type CommentNodeItemProps = {
  node: CommentNode;
  depth: number;
  onToggleHeart: (commentId: string) => Promise<void>;
  onSelectReply: (commentId: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (content: string, parentId: string) => Promise<void>;
  activeReplyId: string | null;
};

type CommentCardProps = {
  node: CommentNode;
  pending: boolean;
  onToggleHeart: () => void;
  onReply: () => void;
};

type CommentActionsProps = {
  heartCount: number;
  viewerHasHearted: boolean;
  pending: boolean;
  onToggleHeart: () => void;
  onReply: () => void;
};

type ReplyAreaProps = {
  isReplying: boolean;
  nodeId: string;
  onSubmitReply: (content: string, parentId: string) => Promise<void>;
  onCancelReply: () => void;
};

type RepliesProps = CommentNodeItemProps;

export function CommentNodeItem(props: CommentNodeItemProps) {
  const { node, depth, onToggleHeart, onSelectReply, activeReplyId } = props;
  const { pending, handleToggle } = useToggleHandler(node.id, onToggleHeart);
  const paddingClass = useMemo(
    () => commentDepthPadding[Math.min(depth, commentDepthPadding.length - 1)],
    [depth],
  );
  const isReplying = activeReplyId === node.id;

  return (
    <div className={cn('space-y-3', paddingClass)}>
      <CommentCard
        node={node}
        pending={pending}
        onToggleHeart={handleToggle}
        onReply={() => onSelectReply(node.id)}
      />
      <ReplyArea
        isReplying={isReplying}
        nodeId={node.id}
        onSubmitReply={props.onSubmitReply}
        onCancelReply={props.onCancelReply}
      />
      <Replies {...props} depth={depth + 1} />
    </div>
  );
}

function useToggleHandler(commentId: string, onToggleHeart: (commentId: string) => Promise<void>) {
  const [pending, startTransition] = useTransition();
  const handleToggle = useCallback(() => {
    startTransition(async () => {
      try {
        await onToggleHeart(commentId);
      } catch (error) {
        console.error('toggleHeart error', error);
      }
    });
  }, [commentId, onToggleHeart]);
  return { pending, handleToggle };
}

function CommentCard({ node, pending, onToggleHeart, onReply }: CommentCardProps) {
  return (
    <article className="rounded-3xl bg-neutral-900 p-4 text-sm shadow-inner shadow-black/15">
      <header className="mb-2 flex items-center justify-between text-neutral-400">
        <span className="font-semibold text-neutral-300">익명</span>
        <span className="text-xs">
          {new Intl.DateTimeFormat('ko', { hour: '2-digit', minute: '2-digit' }).format(
            new Date(node.createdAt),
          )}
        </span>
      </header>
      <p className="leading-relaxed text-neutral-200">{node.content}</p>
      <CommentActions
        heartCount={node.heartCount}
        viewerHasHearted={node.viewerHasHearted}
        pending={pending}
        onToggleHeart={onToggleHeart}
        onReply={onReply}
      />
    </article>
  );
}

function CommentActions({ heartCount, viewerHasHearted, pending, onToggleHeart, onReply }: CommentActionsProps) {
  return (
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
    <button type="button" onClick={onReply} className="text-neutral-500" disabled={pending}>
      답글 달기
    </button>
  </div>
  );
}

function ReplyArea({ isReplying, nodeId, onSubmitReply, onCancelReply }: ReplyAreaProps) {
  if (!isReplying) {
    return null;
  }
  return (
    <div className="pl-4">
      <CommentComposer
        onSubmit={(content) => onSubmitReply(content, nodeId)}
        parentId={nodeId}
        placeholder="따뜻한 답글을 남겨 주세요"
        onCancel={onCancelReply}
      />
    </div>
  );
}

function Replies(props: RepliesProps) {
  const { node, depth, activeReplyId } = props;
  if (node.replies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 border-l border-neutral-800 pl-4">
      {node.replies.map((reply) => (
        <CommentNodeItem
          key={reply.id}
          node={reply}
          depth={depth}
          onToggleHeart={props.onToggleHeart}
          onSelectReply={props.onSelectReply}
          onCancelReply={props.onCancelReply}
          onSubmitReply={props.onSubmitReply}
          activeReplyId={activeReplyId}
        />
      ))}
    </div>
  );
}
