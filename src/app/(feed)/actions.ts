'use server';

import { submitDemoComment, toggleDemoHeart } from '@/lib/demo/feed-demo';
import { createSupabaseServerClient } from '@/lib/adapters/supabase/server-client';
import { createSupabaseCommentRepository } from '@/lib/adapters/supabase/comment-repository';
import { createSupabaseReactionRepository } from '@/lib/adapters/supabase/reaction-repository';
import { createCommentService, createDefaultCommentTreeBuilder } from '@/lib/comments';
import { createReactionService } from '@/lib/reactions';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const DEMO_VIEWER_ID = process.env.NEXT_PUBLIC_DEMO_VIEWER_ID ?? 'demo-viewer';

const FALLBACK_PROFILE_ID =
  process.env.SUPABASE_DEMO_PROFILE_ID ??
  process.env.NEXT_PUBLIC_SUPABASE_DEMO_PROFILE_ID ??
  process.env.NEXT_PUBLIC_DEMO_VIEWER_ID ??
  null;

function resolveUserId(userId: string | null | undefined) {
  return userId ?? FALLBACK_PROFILE_ID;
}

export async function submitCommentAction(input: { threadId: string; content: string; parentId?: string | null }) {
  const trimmed = input.content.trim();

  if (isDemoMode) {
    return handleDemoComment({ ...input, content: trimmed });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const authorId = resolveUserId(user?.id);

  if (!authorId) {
    return { success: false, error: 'AUTHOR_ID_MISSING' } as const;
  }
  if (!trimmed) {
    return { success: false, error: 'EMPTY_CONTENT' } as const;
  }

  const commentRepo = createSupabaseCommentRepository({ getClient: async () => supabase });
  const commentService = createCommentService({ commentRepo, treeBuilder: createDefaultCommentTreeBuilder() });

  try {
    const commentNode = await commentService.createComment({
      threadId: input.threadId,
      authorId,
      parentId: input.parentId ?? null,
      content: trimmed,
    });

    return { success: true, comment: commentNode } as const;
  } catch (error) {
    console.error('submitCommentAction error', error);
    return { success: false, error: 'SERVER_ERROR' } as const;
  }
}

export async function toggleHeartAction(input: { commentId: string }) {
  if (isDemoMode) {
    return handleDemoHeart(input.commentId);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const reactorId = resolveUserId(user?.id);

  if (!reactorId) {
    return { success: false, error: 'REACTOR_ID_MISSING' } as const;
  }

  const reactionRepo = createSupabaseReactionRepository({ getClient: async () => supabase });
  const reactionService = createReactionService({ reactionRepo });

  try {
    const reaction = await reactionService.toggleHeart({ commentId: input.commentId, reactorId });
    const mutualLikeBanner = await reactionService.getMutualLikeBanner(reactorId);

    return { success: true, reaction, mutualLikeBanner } as const;
  } catch (error) {
    console.error('toggleHeartAction error', error);
    return { success: false, error: 'SERVER_ERROR' } as const;
  }
}

type DemoCommentInput = { threadId: string; content: string; parentId?: string | null };

type DemoToggleResult = { success: true; reaction: ReturnType<typeof toggleDemoHeart>['reaction']; mutualLikeBanner: ReturnType<typeof toggleDemoHeart>['mutualLikeBanner'] } | { success: false; error: 'SERVER_ERROR' };

type DemoCommentResult = { success: true; comment: ReturnType<typeof submitDemoComment> } | { success: false; error: 'EMPTY_CONTENT' | 'SERVER_ERROR' };

function handleDemoComment(input: DemoCommentInput): DemoCommentResult {
  if (!input.content) {
    return { success: false, error: 'EMPTY_CONTENT' } as const;
  }

  try {
    const commentNode = submitDemoComment({
      threadId: input.threadId,
      content: input.content,
      parentId: input.parentId ?? null,
      authorId: DEMO_VIEWER_ID,
    });
    return { success: true, comment: commentNode } as const;
  } catch (error) {
    console.error('submitCommentAction demo error', error);
    return { success: false, error: 'SERVER_ERROR' } as const;
  }
}

function handleDemoHeart(commentId: string): DemoToggleResult {
  try {
    const { reaction, mutualLikeBanner } = toggleDemoHeart({
      commentId,
      reactorId: DEMO_VIEWER_ID,
    });
    return { success: true, reaction, mutualLikeBanner } as const;
  } catch (error) {
    console.error('toggleHeartAction demo error', error);
    return { success: false, error: 'SERVER_ERROR' } as const;
  }
}
