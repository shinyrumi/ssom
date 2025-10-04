import { randomUUID } from 'node:crypto';
import type { CommentNode } from '@/lib/comments';
import type { MutualLikeBanner, ReactionToggleResult } from '@/lib/reactions';
import type { Thread } from '@/lib/threads';

type DemoComment = {
  id: string;
  threadId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  hearts: Set<string>;
};

type DemoState = {
  viewerId: string;
  thread: Thread;
  comments: DemoComment[];
};

const GLOBAL_KEY = '__SSOM_DEMO_FEED_STATE__';
const DEMO_VIEWER_ID = process.env.NEXT_PUBLIC_DEMO_VIEWER_ID ?? 'demo-viewer';

function initializeState(): DemoState {
  const publishedAt = new Date(Date.now() - 1000 * 60 * 60).toISOString();
  const baseCommentCreatedAt = new Date(Date.now() - 1000 * 60 * 30).toISOString();

  return {
    viewerId: DEMO_VIEWER_ID,
    thread: {
      id: 'demo-thread',
      title: 'THE SSOM 데모 쓰레드',
      body: '가상의 유저로 댓글과 공감 하트를 마음껏 테스트해 보세요.',
      publishedAt,
      isActive: true,
    },
    comments: [
      {
        id: 'demo-comment-1',
        threadId: 'demo-thread',
        authorId: 'demo-partner',
        parentId: null,
        content: '안녕! 여기다 댓글을 달면 바로 아래에서 볼 수 있어요.',
        createdAt: baseCommentCreatedAt,
        hearts: new Set<string>(['demo-partner']),
      },
      {
        id: 'demo-comment-2',
        threadId: 'demo-thread',
        authorId: 'demo-viewer',
        parentId: 'demo-comment-1',
        content: '대댓글도 가능하니 한번 테스트해 보세요!',
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        hearts: new Set<string>(['demo-partner']),
      },
    ],
  };
}

function getState(): DemoState {
  const globalAny = globalThis as Record<string, unknown>;
  if (!globalAny[GLOBAL_KEY]) {
    globalAny[GLOBAL_KEY] = initializeState();
  }
  return globalAny[GLOBAL_KEY] as DemoState;
}

function sortTree(nodes: CommentNode[]): CommentNode[] {
  return [...nodes]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((node) => ({
      ...node,
      replies: sortTree(node.replies),
    }));
}

function buildCommentNodes(state: DemoState): CommentNode[] {
  const nodeMap = new Map<string, CommentNode>();

  state.comments.forEach((comment) => {
    nodeMap.set(comment.id, {
      id: comment.id,
      threadId: comment.threadId,
      authorId: comment.authorId,
      parentId: comment.parentId,
      content: comment.content,
      createdAt: comment.createdAt,
      heartCount: comment.hearts.size,
      viewerHasHearted: comment.hearts.has(state.viewerId),
      replies: [],
    });
  });

  state.comments.forEach((comment) => {
    if (!comment.parentId) {
      return;
    }
    const parent = nodeMap.get(comment.parentId);
    const child = nodeMap.get(comment.id);
    if (parent && child) {
      parent.replies = [...parent.replies, child];
    }
  });

  const roots = state.comments
    .filter((comment) => !comment.parentId)
    .map((comment) => nodeMap.get(comment.id)!)
    .filter(Boolean);

  return sortTree(roots);
}

export function loadDemoFeedData(): {
  thread: Thread | null;
  comments: CommentNode[];
  mutualLikeBanner: MutualLikeBanner | null;
  viewerId: string;
} {
  const state = getState();
  return {
    thread: state.thread,
    comments: buildCommentNodes(state),
    mutualLikeBanner: null,
    viewerId: state.viewerId,
  };
}

export function submitDemoComment(params: {
  threadId: string;
  content: string;
  parentId: string | null;
  authorId: string;
}): CommentNode {
  const state = getState();
  const createdAt = new Date().toISOString();
  const newComment: DemoComment = {
    id: randomUUID(),
    threadId: params.threadId,
    authorId: params.authorId,
    parentId: params.parentId,
    content: params.content,
    createdAt,
    hearts: new Set(),
  };

  state.comments.push(newComment);

  return {
    id: newComment.id,
    threadId: newComment.threadId,
    authorId: newComment.authorId,
    parentId: newComment.parentId,
    content: newComment.content,
    createdAt: newComment.createdAt,
    heartCount: 0,
    viewerHasHearted: false,
    replies: [],
  };
}

export function toggleDemoHeart(params: {
  commentId: string;
  reactorId: string;
}): { reaction: ReactionToggleResult; mutualLikeBanner: MutualLikeBanner | null } {
  const state = getState();
  const target = state.comments.find((comment) => comment.id === params.commentId);

  if (!target) {
    throw new Error('COMMENT_NOT_FOUND');
  }

  const hasHeart = target.hearts.has(params.reactorId);
  if (hasHeart) {
    target.hearts.delete(params.reactorId);
  } else {
    target.hearts.add(params.reactorId);
  }

  const reaction: ReactionToggleResult = {
    commentId: target.id,
    reactorId: params.reactorId,
    isActive: !hasHeart,
    total: target.hearts.size,
  };

  return { reaction, mutualLikeBanner: null };
}
