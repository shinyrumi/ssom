import type { CommentNode } from '@/lib/comments';

type ToggleFn = (commentId: string) => Promise<void>;

type SubmitFn = (content: string, parentId: string) => Promise<void>;

export type CommentNodeItemProps = {
  node: CommentNode;
  depth: number;
  onToggleHeart: ToggleFn;
  onSelectReply: (commentId: string) => void;
  onCancelReply: () => void;
  onSubmitReply: SubmitFn;
  activeReplyId: string | null;
  canHeart: boolean;
  canReply: boolean;
};

export type ToggleHandler = {
  pending: boolean;
  handleToggle: () => void;
};

export type CommentCardProps = {
  node: CommentNode;
  pending: boolean;
  onToggleHeart: () => void;
  onReply: () => void;
  canHeart: boolean;
  canReply: boolean;
};

export type CommentActionsProps = {
  heartCount: number;
  viewerHasHearted: boolean;
  pending: boolean;
  onToggleHeart: () => void;
  onReply: () => void;
  canHeart: boolean;
  canReply: boolean;
};

export type ReplyAreaProps = {
  isReplying: boolean;
  nodeId: string;
  onSubmitReply: SubmitFn;
  onCancelReply: () => void;
  canReply: boolean;
};

export type CommentRepliesProps = {
  nodes: CommentNode[];
  depth: number;
  activeReplyId: string | null;
  canHeart: boolean;
  canReply: boolean;
  handlers: Pick<CommentNodeItemProps, 'onToggleHeart' | 'onSelectReply' | 'onCancelReply' | 'onSubmitReply'>;
};
