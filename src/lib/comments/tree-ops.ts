import type { CommentNode } from './types';

type TreeResult = {
  changed: boolean;
  nodes: CommentNode[];
};

const depthPaddingClass = ['pl-0', 'pl-4', 'pl-8', 'pl-12'];

export const commentDepthPadding = depthPaddingClass;

export const normalizeCommentNode = (node: CommentNode): CommentNode => ({
  ...node,
  replies: node.replies?.map((reply) => normalizeCommentNode(reply)) ?? [],
});

export const normalizeCommentTree = (nodes: CommentNode[]): CommentNode[] =>
  nodes.map((node) => normalizeCommentNode(node));

export function insertCommentNode(nodes: CommentNode[], newNode: CommentNode): CommentNode[] {
  const normalizedNewNode = normalizeCommentNode(newNode);
  if (!normalizedNewNode.parentId) {
    return [...nodes, normalizedNewNode];
  }
  const { changed, nodes: updated } = insertInto(nodes, normalizedNewNode);
  return changed ? updated : nodes;
}

function insertInto(nodes: CommentNode[], newNode: CommentNode): TreeResult {
  let changed = false;
  const next = nodes.map((node) => {
    if (node.id === newNode.parentId) {
      changed = true;
      return { ...node, replies: [...node.replies, newNode] };
    }
    if (node.replies.length > 0) {
      const child = insertInto(node.replies, newNode);
      if (child.changed) {
        changed = true;
        return { ...node, replies: child.nodes };
      }
    }
    return node;
  });
  return { changed, nodes: changed ? next : nodes };
}

export function replaceCommentNode(
  nodes: CommentNode[],
  targetId: string,
  replacement: CommentNode,
): CommentNode[] {
  const normalizedReplacement = normalizeCommentNode(replacement);
  const { changed, nodes: updated } = replaceInTree(nodes, targetId, normalizedReplacement);
  return changed ? updated : nodes;
}

function replaceInTree(
  nodes: CommentNode[],
  targetId: string,
  replacement: CommentNode,
): TreeResult {
  let changed = false;
  const next = nodes.map((node) => {
    if (node.id === targetId) {
      changed = true;
      return replacement;
    }
    if (node.replies.length > 0) {
      const child = replaceInTree(node.replies, targetId, replacement);
      if (child.changed) {
        changed = true;
        return { ...node, replies: child.nodes };
      }
    }
    return node;
  });
  return { changed, nodes: changed ? next : nodes };
}

export function removeCommentNode(nodes: CommentNode[], targetId: string): CommentNode[] {
  let changed = false;
  const next: CommentNode[] = [];

  nodes.forEach((node) => {
    if (node.id === targetId) {
      changed = true;
      return;
    }
    let current = node;
    if (node.replies.length > 0) {
      const updatedReplies = removeCommentNode(node.replies, targetId);
      if (updatedReplies !== node.replies) {
        current = { ...node, replies: updatedReplies };
        changed = true;
      }
    }
    next.push(current);
  });

  return changed ? next : nodes;
}

export function updateCommentNode(
  nodes: CommentNode[],
  commentId: string,
  updater: (node: CommentNode) => CommentNode,
): CommentNode[] {
  const { changed, nodes: updated } = updateTree(nodes, commentId, updater);
  return changed ? updated : nodes;
}

function updateTree(
  nodes: CommentNode[],
  commentId: string,
  updater: (node: CommentNode) => CommentNode,
): TreeResult {
  let changed = false;
  const next = nodes.map((node) => {
    if (node.id === commentId) {
      changed = true;
      return normalizeCommentNode(updater(normalizeCommentNode(node)));
    }
    if (node.replies.length > 0) {
      const child = updateTree(node.replies, commentId, updater);
      if (child.changed) {
        changed = true;
        return { ...node, replies: child.nodes };
      }
    }
    return node;
  });
  return { changed, nodes: changed ? next : nodes };
}

export function findCommentNode(nodes: CommentNode[], commentId: string): CommentNode | null {
  for (const node of nodes) {
    if (node.id === commentId) {
      return normalizeCommentNode(node);
    }
    if (node.replies.length > 0) {
      const found = findCommentNode(node.replies, commentId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
