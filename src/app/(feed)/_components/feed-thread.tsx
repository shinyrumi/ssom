'use client';

import type { CommentNode } from '@/lib/comments';
import type { MutualLikeBanner } from '@/lib/reactions';
import type { Thread } from '@/lib/threads';
import { CommentComposer } from './comment-composer';
import { CommentNodeItem } from './comment-node-item';
import { useFeedThreadController, type FeedThreadController } from './use-feed-thread-controller';
import type { ToastState, ToastVariant } from './use-toast';

type FeedThreadProps = {
  data: {
    thread: Thread | null;
    comments: CommentNode[];
    mutualLikeBanner: MutualLikeBanner | null;
    viewerId?: string | null;
  };
};

const toastStyleMap: Record<ToastVariant, string> = {
  success: 'bg-emerald-500/90 text-white',
  error: 'bg-rose-500/90 text-white',
  info: 'bg-neutral-800/90 text-neutral-100',
};

export function FeedThread({ data }: FeedThreadProps) {
  const controller = useFeedThreadController(data);

  return (
    <section className="space-y-6">
      {controller.hasThread ? (
        <article className="rounded-3xl bg-neutral-900 p-6 shadow-lg shadow-black/40">
          <p className="text-sm uppercase tracking-widest text-neutral-500">오늘의 질문</p>
          <h1 className="mt-3 text-2xl font-semibold text-neutral-50">{controller.thread?.title}</h1>
          <p className="mt-4 text-neutral-200">{controller.thread?.body}</p>
        </article>
      ) : (
        <section className="grid min-h-[60vh] place-content-center text-center text-neutral-400">
          아직 등록된 질문이 없습니다.
        </section>
      )}

      {controller.banner ? (
        <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          서로 마음이 통했어요! 조금 더 솔직한 이야기를 나눠볼까요?
        </div>
      ) : null}

      {controller.hasThread ? <CommentComposer onSubmit={controller.handleTopLevelSubmit} /> : null}

      <CommentList controller={controller} />
      <ToastViewer toast={controller.toast} />
    </section>
  );
}

type CommentListProps = {
  controller: FeedThreadController;
};

function CommentList({ controller }: CommentListProps) {
  if (controller.comments.length === 0) {
    return (
      <div className="space-y-3">
        <p className="rounded-3xl border border-dashed border-neutral-800 p-6 text-sm text-neutral-400">
          아직 댓글이 없어요. 첫 번째 이야기의 주인공이 되어 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {controller.comments.map((comment) => (
        <CommentNodeItem
          key={comment.id}
          node={comment}
          depth={0}
          onToggleHeart={controller.handleToggleHeart}
          onSelectReply={controller.selectReply}
          onCancelReply={controller.cancelReply}
          onSubmitReply={controller.handleReplySubmit}
          activeReplyId={controller.replyTargetId}
        />
      ))}
    </div>
  );
}

type ToastViewerProps = {
  toast: ToastState;
};

function ToastViewer({ toast }: ToastViewerProps) {
  if (!toast) {
    return null;
  }
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-6">
      <div
        className={`pointer-events-auto rounded-full px-4 py-2 text-sm shadow-lg shadow-black/40 transition-transform duration-200 ${toastStyleMap[toast.variant]}`}
      >
        {toast.message}
      </div>
    </div>
  );
}
