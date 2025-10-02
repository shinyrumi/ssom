'use client';

import type { CommentNode } from '@/lib/comments';
import type { MutualLikeBanner } from '@/lib/reactions';
import type { Thread } from '@/lib/threads';
import { CommentComposer } from './comment-composer';
import { CommentNodeItem } from './comment-node-item';
import { useCommentInteractions } from './use-comment-interactions';

type FeedThreadProps = {
  data: {
    thread: Thread | null;
    comments: CommentNode[];
    mutualLikeBanner: MutualLikeBanner | null;
    viewerId?: string | null;
  };
};

const VIEWER_ID_FALLBACK = process.env.NEXT_PUBLIC_SUPABASE_DEMO_PROFILE_ID ?? 'demo-viewer';

export const FeedThread = ({ data }: FeedThreadProps) => {
  const viewerId = data.viewerId ?? VIEWER_ID_FALLBACK;
  const { comments, banner, createComment, toggleHeart } = useCommentInteractions({
    thread: data.thread,
    viewerId,
    initialComments: data.comments,
    initialBanner: data.mutualLikeBanner,
  });

  if (!data.thread) {
    return (
      <section className="grid min-h-[60vh] place-content-center text-center text-neutral-400">
        아직 등록된 질문이 없습니다.
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <article className="rounded-3xl bg-neutral-900 p-6 shadow-lg shadow-black/40">
        <p className="text-sm uppercase tracking-widest text-neutral-500">오늘의 질문</p>
        <h1 className="mt-3 text-2xl font-semibold text-neutral-50">{data.thread.title}</h1>
        <p className="mt-4 text-neutral-200">{data.thread.body}</p>
      </article>

      {banner ? (
        <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          서로 마음이 통했어요! 조금 더 솔직한 이야기를 나눠볼까요?
        </div>
      ) : null}

      <CommentComposer onSubmit={createComment} />

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-neutral-800 p-6 text-sm text-neutral-400">
            아직 댓글이 없어요. 첫 번째 이야기의 주인공이 되어 주세요.
          </p>
        ) : (
          comments.map((comment) => (
            <CommentNodeItem key={comment.id} node={comment} depth={0} onToggleHeart={toggleHeart} />
          ))
        )}
      </div>
    </section>
  );
};
