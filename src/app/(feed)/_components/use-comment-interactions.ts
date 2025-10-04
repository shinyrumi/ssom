'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
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

const FALLBACK_VIEWER_ID = process.env.NEXT_PUBLIC_SUPABASE_DEMO_PROFILE_ID ?? process.env.NEXT_PUBLIC_DEMO_VIEWER_ID ?? null;

type UseCommentInteractionsParams = {
  thread: Thread | null;
  viewerId: string | null;
  initialComments: CommentNode[];
  initialBanner: MutualLikeBanner | null;
};

type SharedContext = {
  thread: Thread | null;
  viewerId: string | null;
  commentsRef: MutableRefObject<CommentNode[]>;
  setComments: Dispatch<SetStateAction<CommentNode[]>>;
  setBanner: Dispatch<SetStateAction<MutualLikeBanner | null>>;
};

type UseCommentInteractionsResult = {
  comments: CommentNode[];
  banner: MutualLikeBanner | null;
  createComment: (content: string, parentId?: string | null) => Promise<void>;
  toggleHeart: (commentId: string) => Promise<boolean>;
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
    viewerId: viewerId ?? FALLBACK_VIEWER_ID,
    commentsRef,
    setComments,
    setBanner,
  };

  return {
    comments,
    banner,
    createComment: (content: string, parentId?: string | null) => performCreateComment(ctx, content, parentId ?? null),
    toggleHeart: (commentId: string) => performToggleHeart(ctx, commentId),
  };
}

async function performCreateComment(ctx: SharedContext, content: string, parentId: string | null) {
  if (!ctx.thread) {
    throw new Error('THREAD_MISSING');
  }

  if (!ctx.viewerId) {
    throw new Error('AUTHOR_ID_MISSING');
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
    parentId,
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
    parentId,
  });

  if (result.success) {
    ctx.setComments((prev) => replaceCommentNode(prev, optimisticId, result.comment));
    return;
  }

  ctx.setComments((prev) => removeCommentNode(prev, optimisticId));
  throw new Error(result.error);
}

async function performToggleHeart(ctx: SharedContext, commentId: string): Promise<boolean> {
  if (!ctx.viewerId) {
    throw new Error('REACTOR_ID_MISSING');
  }

  const existing = findCommentNode(ctx.commentsRef.current, commentId);
  if (!existing) {
    return false;
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
    return result.reaction.isActive;
  }

  ctx.setComments((prev) =>
    updateCommentNode(prev, commentId, () => ({
      ...existing,
      replies: existing.replies.map((reply) => ({ ...reply })),
    })),
  );
  throw new Error(result.error);
}
