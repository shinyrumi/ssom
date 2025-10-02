import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './server-client';
import type {
  Comment,
  CommentDraft,
  CommentRepository,
  CreateCommentInput,
} from '../../comments';

type CommentRow = {
  id: string;
  thread_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
};

type ViewerHeartRow = {
  comment_id: string;
};

type RepositoryOptions = {
  getClient?: () => Promise<SupabaseClient>;
};

const HEART_TYPE = 'heart';

function normalizeComment(
  row: CommentRow,
  heartCounts: Map<string, number>,
  viewerHearted: Set<string>,
): Comment {
  return {
    id: row.id,
    threadId: row.thread_id,
    authorId: row.author_id,
    parentId: row.parent_id,
    content: row.content,
    createdAt: row.created_at,
    heartCount: heartCounts.get(row.id) ?? 0,
    viewerHasHearted: viewerHearted.has(row.id),
  };
}

async function selectCommentsForThread(
  supabase: SupabaseClient,
  threadId: string,
): Promise<CommentRow[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, thread_id, author_id, parent_id, content, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .returns<CommentRow[]>();

  if (error || !data) {
    console.error('selectCommentsForThread error', error?.message);
    return [];
  }

  return data;
}

async function fetchViewerHeartedCommentIds(
  supabase: SupabaseClient,
  viewerId: string,
  threadId: string,
): Promise<Set<string>> {
  const response = await supabase
    .from('reactions')
    .select('comment_id, comments!inner(thread_id)')
    .eq('reactor_id', viewerId)
    .eq('type', HEART_TYPE)
    .eq('comments.thread_id', threadId);

  if (response.error) {
    throw new Error(response.error.message);
  }

  const ids = new Set<string>();
  (response.data as ViewerHeartRow[] | null)?.forEach((row) => {
    if (row.comment_id) {
      ids.add(row.comment_id);
    }
  });
  return ids;
}

async function fetchHeartCounts(
  supabase: SupabaseClient,
  commentIds: string[],
): Promise<Map<string, number>> {
  if (commentIds.length === 0) {
    return new Map();
  }

  const response = await supabase
    .from('reactions')
    .select('comment_id')
    .eq('type', HEART_TYPE)
    .in('comment_id', commentIds);

  if (response.error) {
    throw new Error(response.error.message);
  }

  const counts = new Map<string, number>();
  (response.data as ViewerHeartRow[] | null)?.forEach((row) => {
    if (!row.comment_id) {
      return;
    }
    counts.set(row.comment_id, (counts.get(row.comment_id) ?? 0) + 1);
  });
  return counts;
}

async function safeFetchHeartCounts(
  supabase: SupabaseClient,
  commentIds: string[],
): Promise<Map<string, number>> {
  try {
    return await fetchHeartCounts(supabase, commentIds);
  } catch (error) {
    console.error('fetchHeartCounts error', error);
    return new Map();
  }
}

async function safeFetchViewerHeartedCommentIds(
  supabase: SupabaseClient,
  viewerId: string,
  threadId: string,
): Promise<Set<string>> {
  try {
    return await fetchViewerHeartedCommentIds(supabase, viewerId, threadId);
  } catch (error) {
    console.error('fetchViewerHeartedCommentIds error', error);
    return new Set();
  }
}

export const createSupabaseCommentRepository = (
  options?: RepositoryOptions,
): CommentRepository => {
  const getClient = options?.getClient ?? createSupabaseServerClient;

  return {
    async listByThread({ threadId, viewerId }) {
      const supabase = await getClient();
      const rows = await selectCommentsForThread(supabase, threadId);
      if (rows.length === 0) {
        return [];
      }

      const commentIds = rows.map((row) => row.id);
      const heartCounts = await safeFetchHeartCounts(supabase, commentIds);
      const viewerHearted = viewerId
        ? await safeFetchViewerHeartedCommentIds(supabase, viewerId, threadId)
        : new Set<string>();

      return rows.map((row) => normalizeComment(row, heartCounts, viewerHearted));
    },

    createDraft(input: CreateCommentInput): CommentDraft {
      return {
        id: randomUUID(),
        threadId: input.threadId,
        authorId: input.authorId,
        parentId: input.parentId ?? null,
        content: input.content,
        createdAt: new Date().toISOString(),
      };
    },

    async persistComment(draft: CommentDraft) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('comments')
        .insert({
          id: draft.id,
          thread_id: draft.threadId,
          author_id: draft.authorId,
          parent_id: draft.parentId,
          content: draft.content,
        })
        .select('id, thread_id, author_id, parent_id, content, created_at')
        .maybeSingle<CommentRow>();

      if (error || !data) {
        throw new Error(error?.message ?? '댓글 저장 실패');
      }

      return normalizeComment(data, new Map(), new Set());
    },
  };
};
