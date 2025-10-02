'use server';

import { createSupabaseAdminClient } from '@/lib/adapters/supabase/admin-client';
import { createSupabaseCommentRepository } from '@/lib/adapters/supabase/comment-repository';
import { createSupabaseReactionRepository } from '@/lib/adapters/supabase/reaction-repository';
import { createCommentService, createDefaultCommentTreeBuilder } from '@/lib/comments';
import { createReactionService } from '@/lib/reactions';

const DEMO_PROFILE_ID =
  process.env.SUPABASE_DEMO_PROFILE_ID ?? process.env.NEXT_PUBLIC_SUPABASE_DEMO_PROFILE_ID ?? '';

function resolveAuthorId(explicit?: string | null) {
  return explicit ?? DEMO_PROFILE_ID;
}

export async function submitCommentAction(input: {
  threadId: string;
  content: string;
  parentId?: string | null;
  authorId?: string | null;
}) {
  const authorId = resolveAuthorId(input.authorId);
  if (!authorId) {
    return { success: false, error: 'AUTHOR_ID_MISSING' } as const;
  }

  if (!input.content.trim()) {
    return { success: false, error: 'EMPTY_CONTENT' } as const;
  }

  const adminClient = createSupabaseAdminClient();
  const commentRepo = createSupabaseCommentRepository({
    getClient: async () => adminClient,
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
  reactorId?: string | null;
}) {
  const reactorId = resolveAuthorId(input.reactorId);
  if (!reactorId) {
    return { success: false, error: 'REACTOR_ID_MISSING' } as const;
  }

  const adminClient = createSupabaseAdminClient();
  const reactionRepo = createSupabaseReactionRepository({
    getClient: async () => adminClient,
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
