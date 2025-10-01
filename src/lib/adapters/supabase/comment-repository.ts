import { randomUUID } from 'node:crypto';
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
  heart_count?: number | null;
};

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    threadId: row.thread_id,
    authorId: row.author_id,
    parentId: row.parent_id,
    content: row.content,
    createdAt: row.created_at,
    heartCount: row.heart_count ?? 0,
    viewerHasHearted: false,
  };
}

export const createSupabaseCommentRepository = (): CommentRepository => ({
  async listByThread(threadId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('comments')
      .select('id, thread_id, author_id, parent_id, content, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .returns<CommentRow[]>();

    if (error || !data) {
      console.error('listByThread error', error?.message);
      return [];
    }

    return data.map((row) => mapComment(row));
  },

  createDraft(input: CreateCommentInput): CommentDraft {
    return {
      id: randomUUID(),
      threadId: input.threadId,
      parentId: input.parentId ?? null,
      content: input.content,
      createdAt: new Date().toISOString(),
    };
  },

  async persistComment(draft: CommentDraft) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('comments')
      .insert({
        id: draft.id,
        thread_id: draft.threadId,
        parent_id: draft.parentId,
        content: draft.content,
      })
      .select('id, thread_id, author_id, parent_id, content, created_at')
      .maybeSingle<CommentRow>();

    if (error || !data) {
      throw new Error(error?.message ?? '댓글 저장 실패');
    }

    return mapComment(data);
  },
});
