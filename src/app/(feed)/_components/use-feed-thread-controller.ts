'use client';

import { useCallback, useMemo, useState } from 'react';
import type { CommentNode } from '@/lib/comments';
import type { MutualLikeBanner } from '@/lib/reactions';
import type { Thread } from '@/lib/threads';
import { useCommentInteractions } from './use-comment-interactions';
import { useToast, type ToastState, type ToastVariant } from './use-toast';

type FeedThreadData = {
  thread: Thread | null;
  comments: CommentNode[];
  mutualLikeBanner: MutualLikeBanner | null;
  viewerId?: string | null;
};

export type FeedThreadController = {
  hasThread: boolean;
  thread: Thread | null;
  comments: CommentNode[];
  banner: MutualLikeBanner | null;
  replyTargetId: string | null;
  toast: ToastState;
  handleTopLevelSubmit: (content: string) => Promise<void>;
  handleReplySubmit: (content: string, parentId: string) => Promise<void>;
  handleToggleHeart: (commentId: string) => Promise<void>;
  selectReply: (commentId: string) => void;
  cancelReply: () => void;
};

const VIEWER_ID_FALLBACK = process.env.NEXT_PUBLIC_SUPABASE_DEMO_PROFILE_ID ?? 'demo-viewer';

export function useFeedThreadController(data: FeedThreadData): FeedThreadController {
  const viewerId = data.viewerId ?? VIEWER_ID_FALLBACK;
  const interactions = useCommentInteractions({
    thread: data.thread,
    viewerId,
    initialComments: data.comments,
    initialBanner: data.mutualLikeBanner,
  });

  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const { toast, showToast } = useToast();
  const notify = useCallback((message: string, variant: ToastVariant) => showToast(message, variant), [showToast]);

  const handlers = useMemo(
    () =>
      createInteractionHandlers({
        interactions,
        notify,
        clearReplyTarget: () => setReplyTargetId(null),
      }),
    [interactions, notify],
  );

  const hasThread = useMemo(() => Boolean(data.thread), [data.thread]);

  return {
    hasThread,
    thread: data.thread,
    comments: interactions.comments,
    banner: interactions.banner,
    replyTargetId,
    toast,
    handleTopLevelSubmit: handlers.handleTopLevelSubmit,
    handleReplySubmit: handlers.handleReplySubmit,
    handleToggleHeart: handlers.handleToggleHeart,
    selectReply: setReplyTargetId,
    cancelReply: () => setReplyTargetId(null),
  };
}

type HandlerFactoryArgs = {
  interactions: ReturnType<typeof useCommentInteractions>;
  notify: (message: string, variant: ToastVariant) => void;
  clearReplyTarget: () => void;
};

function createInteractionHandlers({ interactions, notify, clearReplyTarget }: HandlerFactoryArgs) {
  const handleTopLevelSubmit = async (content: string) => {
    await interactions.createComment(content, null);
    notify('댓글이 등록되었어요.', 'success');
  };

  const handleReplySubmit = async (content: string, parentId: string) => {
    await interactions.createComment(content, parentId);
    notify('답글이 등록되었어요.', 'success');
    clearReplyTarget();
  };

  const handleToggleHeart = async (commentId: string) => {
    try {
      const active = await interactions.toggleHeart(commentId);
      notify(active ? '하트를 보냈어요.' : '하트를 취소했어요.', active ? 'success' : 'info');
    } catch (error) {
      console.error('toggleHeart error', error);
      notify('하트 처리 중 문제가 발생했습니다.', 'error');
      throw error;
    }
  };

  return { handleTopLevelSubmit, handleReplySubmit, handleToggleHeart };
}
