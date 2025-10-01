import type { Comment, CommentDraft, CommentNode, CreateCommentInput } from './types';

export interface CommentRepository {
  listByThread(threadId: string): Promise<Comment[]>;
  createDraft(input: CreateCommentInput): CommentDraft;
  persistComment(draft: CommentDraft): Promise<Comment>;
}

export interface CommentTreeBuilder {
  buildTree(comments: Comment[]): CommentNode[];
}
