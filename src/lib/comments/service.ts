import type { CommentRepository, CommentTreeBuilder } from './ports';
import type { CommentNode, CreateCommentInput } from './types';

export type CommentServiceDependencies = {
  commentRepo: CommentRepository;
  treeBuilder: CommentTreeBuilder;
};

export type CommentService = {
  listThreadComments: (params: { threadId: string; viewerId?: string }) => Promise<CommentNode[]>;
  createComment: (input: CreateCommentInput) => Promise<CommentNode>;
};

export const createCommentService = (
  deps: CommentServiceDependencies,
): CommentService => ({
  async listThreadComments({ threadId, viewerId }) {
    const comments = await deps.commentRepo.listByThread({ threadId, viewerId });
    return deps.treeBuilder.buildTree(comments);
  },
  async createComment(input) {
    const draft = deps.commentRepo.createDraft({
      threadId: input.threadId,
      authorId: input.authorId,
      parentId: input.parentId ?? null,
      content: input.content,
    });

    const saved = await deps.commentRepo.persistComment(draft);
    return deps.treeBuilder.buildTree([saved])[0];
  },
});
