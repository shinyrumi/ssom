import { Suspense } from 'react';
import { createThreadService } from '@/lib/threads';
import { createCommentService, createDefaultCommentTreeBuilder } from '@/lib/comments';
import { createReactionService } from '@/lib/reactions';
import { createSupabaseThreadRepository } from '@/lib/adapters/supabase/thread-repository';
import { createSupabaseCommentRepository } from '@/lib/adapters/supabase/comment-repository';
import { createSupabaseReactionRepository } from '@/lib/adapters/supabase/reaction-repository';
import { FeedSkeleton } from './_components/feed-skeleton';
import { FeedThread } from './_components/feed-thread';

async function loadFeedData() {
  const viewerId =
    process.env.SUPABASE_DEMO_PROFILE_ID ?? process.env.NEXT_PUBLIC_SUPABASE_DEMO_PROFILE_ID ?? null;

  const threadRepo = createSupabaseThreadRepository();
  const commentRepo = createSupabaseCommentRepository();
  const reactionRepo = createSupabaseReactionRepository();

  const threadService = createThreadService({ threadRepo });
  const commentService = createCommentService({
    commentRepo,
    treeBuilder: createDefaultCommentTreeBuilder(),
  });
  const reactionService = createReactionService({ reactionRepo });

  const activeThread = await threadService.getActiveThread();
  const thread = activeThread ?? (await threadService.getThreadOrLatestFallback());
  const comments = activeThread
    ? await commentService.listThreadComments({ threadId: activeThread.id, viewerId: viewerId ?? undefined })
    : [];
  const mutualLikeBanner = thread && viewerId ? await reactionService.getMutualLikeBanner(viewerId) : null;

  return {
    thread,
    comments,
    mutualLikeBanner,
    viewerId,
  };
}

export default async function FeedPage() {
  const data = await loadFeedData();

  return (
    <main className="mx-auto flex min-h-screen max-w-screen-sm flex-col gap-6 bg-neutral-950 px-4 pb-16 pt-8 text-neutral-50">
      <Suspense fallback={<FeedSkeleton />}>
        <FeedThread data={data} />
      </Suspense>
    </main>
  );
}
