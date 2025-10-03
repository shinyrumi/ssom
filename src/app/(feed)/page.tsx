import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/adapters/supabase/server-client';
import { createThreadService } from '@/lib/threads';
import { createCommentService, createDefaultCommentTreeBuilder } from '@/lib/comments';
import { createReactionService } from '@/lib/reactions';
import { createSupabaseThreadRepository } from '@/lib/adapters/supabase/thread-repository';
import { createSupabaseCommentRepository } from '@/lib/adapters/supabase/comment-repository';
import { createSupabaseReactionRepository } from '@/lib/adapters/supabase/reaction-repository';
import { FeedSkeleton } from './_components/feed-skeleton';
import { FeedThread } from './_components/feed-thread';

const FALLBACK_PROFILE_ID =
  process.env.SUPABASE_DEMO_PROFILE_ID ?? process.env.NEXT_PUBLIC_SUPABASE_DEMO_PROFILE_ID ?? null;

async function loadFeedData() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? FALLBACK_PROFILE_ID;

  const threadRepo = createSupabaseThreadRepository();
  const commentRepo = createSupabaseCommentRepository({
    getClient: async () => supabase,
  });
  const reactionRepo = createSupabaseReactionRepository({
    getClient: async () => supabase,
  });

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
