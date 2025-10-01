import type { Comment, CommentNode } from './types';
import type { CommentTreeBuilder } from './ports';

export const createDefaultCommentTreeBuilder = (): CommentTreeBuilder => ({
  buildTree(comments: Comment[]): CommentNode[] {
    const map = new Map<string, CommentNode>();
    const roots: CommentNode[] = [];

    comments
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach((comment) => {
        map.set(comment.id, { ...comment, replies: [] });
      });

    map.forEach((node) => {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)?.replies.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  },
});
