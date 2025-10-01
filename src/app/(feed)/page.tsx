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
  const threadRepo = createSupabaseThreadRepository();
  const commentRepo = createSupabaseCommentRepository();
  const reactionRepo = createSupabaseReactionRepository();

  const threadService = createThreadService({ threadRepo });
  const commentService = createCommentService({
    commentRepo,
    treeBuilder: createDefaultCommentTreeBuilder(),
  });
  const reactionService = createReactionService({ reactionRepo });

  const [thread, comments] = await Promise.all([
    threadService.getThreadOrLatestFallback(),
    threadService.getActiveThread().then(async (active) => {
      if (!active) {
        return [];
      }
      return commentService.listThreadComments(active.id);
    }),
  ]);

  const mutualLikeBanner = thread
    ? await reactionService.getMutualLikeBanner('viewer', 'target')
    : null;

  return {
    thread,
    comments,
    mutualLikeBanner,
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
