'use server';

import { createSupabaseServerClient } from '@/lib/adapters/supabase/server-client';
import { createSupabaseCommentRepository } from '@/lib/adapters/supabase/comment-repository';
import { createSupabaseReactionRepository } from '@/lib/adapters/supabase/reaction-repository';
import { createCommentService, createDefaultCommentTreeBuilder } from '@/lib/comments';
import { createReactionService } from '@/lib/reactions';

const FALLBACK_PROFILE_ID =
  process.env.SUPABASE_DEMO_PROFILE_ID ?? process.env.NEXT_PUBLIC_SUPABASE_DEMO_PROFILE_ID ?? '';

function resolveUserId(userId: string | null | undefined) {
  if (userId) {
    return userId;
  }
  if (FALLBACK_PROFILE_ID) {
    console.warn('Using fallback demo profile id. Configure Supabase Auth for production.');
    return FALLBACK_PROFILE_ID;
  }
  return null;
}

export async function submitCommentAction(input: {
  threadId: string;
  content: string;
  parentId?: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const authorId = resolveUserId(user?.id);
  if (!authorId) {
    return { success: false, error: 'AUTHOR_ID_MISSING' } as const;
  }

  if (!input.content.trim()) {
    return { success: false, error: 'EMPTY_CONTENT' } as const;
  }

  const commentRepo = createSupabaseCommentRepository({
    getClient: async () => supabase,
  });
  const commentService = createCommentService({
    commentRepo,
    treeBuilder: createDefaultCommentTreeBuilder(),
  });

  try {
    const commentNode = await commentService.createComment({
      threadId: input.threadId,
      authorId,
      parentId: input.parentId ?? null,
      content: input.content,
    });

    return { success: true, comment: commentNode } as const;
  } catch (error) {
    console.error('submitCommentAction error', error);
    return { success: false, error: 'SERVER_ERROR' } as const;
  }
}

export async function toggleHeartAction(input: {
  commentId: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const reactorId = resolveUserId(user?.id);
  if (!reactorId) {
    return { success: false, error: 'REACTOR_ID_MISSING' } as const;
  }

  const reactionRepo = createSupabaseReactionRepository({
    getClient: async () => supabase,
  });
  const reactionService = createReactionService({ reactionRepo });

  try {
    const reaction = await reactionService.toggleHeart({
      commentId: input.commentId,
      reactorId,
    });

    const mutualLikeBanner = await reactionService.getMutualLikeBanner(reactorId);

    return { success: true, reaction, mutualLikeBanner } as const;
  } catch (error) {
    console.error('toggleHeartAction error', error);
    return { success: false, error: 'SERVER_ERROR' } as const;
  }
}
