import { createSupabaseServerClient } from './server-client';
import type { Thread, ThreadRepository, ThreadWithMeta } from '../../threads';

type ThreadRow = {
  id: string;
  title: string;
  body: string;
  published_at: string;
  is_active: boolean;
};

function mapThread(row: ThreadRow): Thread {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    publishedAt: row.published_at,
    isActive: row.is_active,
  };
}

export const createSupabaseThreadRepository = (): ThreadRepository => ({
  async getActiveThread() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('threads')
      .select('id, title, body, published_at, is_active')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle<ThreadRow>();

    if (error) {
      console.error('getActiveThread error', error.message);
      return null;
    }

    return data ? mapThread(data) : null;
  },
  async getThreadById(id) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('threads')
      .select('id, title, body, published_at, is_active')
      .eq('id', id)
      .maybeSingle<ThreadRow>();

    if (error) {
      console.error('getThreadById error', error.message);
      return null;
    }

    return data ? mapThread(data) : null;
  },
  async listRecent(limit = 3) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('threads')
      .select('id, title, body, published_at, is_active')
      .order('published_at', { ascending: false })
      .limit(limit)
      .returns<ThreadRow[]>();

    if (error || !data) {
      console.error('listRecent error', error?.message);
      return [];
    }

    return data.map((row) => ({
      ...mapThread(row),
      commentCount: 0,
    })) satisfies ThreadWithMeta[];
  },
});
