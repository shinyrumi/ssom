'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CommentNode } from '@/lib/comments';
import type { MutualLikeBanner } from '@/lib/reactions';
import type { Thread } from '@/lib/threads';
import {
  findCommentNode,
  insertCommentNode,
  normalizeCommentTree,
  removeCommentNode,
  replaceCommentNode,
  updateCommentNode,
} from '@/lib/comments/tree-ops';
import { submitCommentAction, toggleHeartAction } from '../actions';

type UseCommentInteractionsParams = {
  thread: Thread | null;
  viewerId: string;
  initialComments: CommentNode[];
  initialBanner: MutualLikeBanner | null;
};

type SharedContext = {
  thread: Thread | null;
  viewerId: string;
  commentsRef: React.MutableRefObject<CommentNode[]>;
  setComments: React.Dispatch<React.SetStateAction<CommentNode[]>>;
  setBanner: React.Dispatch<React.SetStateAction<MutualLikeBanner | null>>;
};

type UseCommentInteractionsResult = {
  comments: CommentNode[];
  banner: MutualLikeBanner | null;
  createComment: (content: string) => Promise<void>;
  toggleHeart: (commentId: string) => Promise<void>;
};

export function useCommentInteractions({
  thread,
  viewerId,
  initialComments,
  initialBanner,
}: UseCommentInteractionsParams): UseCommentInteractionsResult {
  const normalizedInitial = useMemo(() => normalizeCommentTree(initialComments), [initialComments]);
  const [comments, setComments] = useState<CommentNode[]>(normalizedInitial);
  const [banner, setBanner] = useState<MutualLikeBanner | null>(initialBanner);
  const commentsRef = useRef<CommentNode[]>(normalizedInitial);

  useEffect(() => {
    setComments(normalizedInitial);
  }, [normalizedInitial]);

  useEffect(() => {
    commentsRef.current = normalizedInitial;
  }, [normalizedInitial]);

  useEffect(() => {
    setBanner(initialBanner);
  }, [initialBanner]);

  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  const ctx: SharedContext = {
    thread,
    viewerId,
    commentsRef,
    setComments,
    setBanner,
  };

  return {
    comments,
    banner,
    createComment: (content: string) => performCreateComment(ctx, content),
    toggleHeart: (commentId: string) => performToggleHeart(ctx, commentId),
  };
}

async function performCreateComment(ctx: SharedContext, content: string) {
  if (!ctx.thread) {
    throw new Error('THREAD_MISSING');
  }

  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('EMPTY_CONTENT');
  }

  const optimisticId = `optimistic-${Date.now()}`;
  const optimisticNode: CommentNode = {
    id: optimisticId,
    threadId: ctx.thread.id,
    authorId: ctx.viewerId,
    parentId: null,
    content: trimmed,
    createdAt: new Date().toISOString(),
    heartCount: 0,
    viewerHasHearted: false,
    replies: [],
  };

  ctx.setComments((prev) => insertCommentNode(prev, optimisticNode));

  const result = await submitCommentAction({
    threadId: ctx.thread.id,
    content: trimmed,
  });

  if (result.success) {
    ctx.setComments((prev) => replaceCommentNode(prev, optimisticId, result.comment));
    return;
  }

  ctx.setComments((prev) => removeCommentNode(prev, optimisticId));
  throw new Error(result.error);
}

async function performToggleHeart(ctx: SharedContext, commentId: string) {
  const existing = findCommentNode(ctx.commentsRef.current, commentId);
  if (!existing) {
    return;
  }

  const optimisticIsActive = !existing.viewerHasHearted;
  const delta = optimisticIsActive ? 1 : -1;

  ctx.setComments((prev) =>
    updateCommentNode(prev, commentId, (node) => ({
      ...node,
      viewerHasHearted: optimisticIsActive,
      heartCount: Math.max(0, node.heartCount + delta),
    })),
  );

  const result = await toggleHeartAction({ commentId });

  if (result.success) {
    ctx.setComments((prev) =>
      updateCommentNode(prev, commentId, (node) => ({
        ...node,
        viewerHasHearted: result.reaction.isActive,
        heartCount: result.reaction.total,
      })),
    );
    ctx.setBanner(result.mutualLikeBanner ?? null);
    return;
  }

  ctx.setComments((prev) =>
    updateCommentNode(prev, commentId, () => ({
      ...existing,
      replies: existing.replies.map((reply) => ({ ...reply })),
    })),
  );
  throw new Error(result.error);
}
