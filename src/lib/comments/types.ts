export type Comment = {
  id: string;
  threadId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  heartCount: number;
  viewerHasHearted: boolean;
};

export type CommentNode = Comment & {
  replies: CommentNode[];
};

export type CreateCommentInput = {
  threadId: string;
  parentId?: string | null;
  content: string;
};

export type CommentDraft = {
  id: string;
  threadId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
};
