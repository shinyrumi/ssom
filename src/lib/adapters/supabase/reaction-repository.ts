import { createSupabaseServerClient } from './server-client';
import type {
  MutualLikeBanner,
  ReactionRepository,
  ReactionToggleInput,
  ReactionToggleResult,
} from '../../reactions';
import type { SupabaseClient } from '@supabase/supabase-js';

type ReactionRow = {
  id: string;
};

type RepositoryOptions = {
  getClient?: () => Promise<SupabaseClient>;
};

async function fetchExistingReaction(
  supabase: SupabaseClient,
  commentId: string,
  reactorId: string,
): Promise<ReactionRow | null> {
  const { data, error } = await supabase
    .from('reactions')
    .select('id')
    .eq('comment_id', commentId)
    .eq('reactor_id', reactorId)
    .maybeSingle<ReactionRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

async function upsertReaction(
  supabase: SupabaseClient,
  existing: ReactionRow | null,
  input: ReactionToggleInput,
): Promise<boolean> {
  if (existing) {
    const { error } = await supabase.from('reactions').delete().eq('id', existing.id);
    if (error) {
      throw new Error(error.message);
    }
    return false;
  }

  const { error } = await supabase.from('reactions').insert({
    comment_id: input.commentId,
    reactor_id: input.reactorId,
    type: 'heart',
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

async function fetchReactionCount(supabase: SupabaseClient, commentId: string): Promise<number> {
  const { count, error } = await supabase
    .from('reactions')
    .select('id', { head: true, count: 'exact' })
    .eq('comment_id', commentId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export const createSupabaseReactionRepository = (
  options?: RepositoryOptions,
): ReactionRepository => {
  const getClient = options?.getClient ?? createSupabaseServerClient;

  return {
    async toggleHeart(input) {
      const supabase = await getClient();
      const existing = await fetchExistingReaction(supabase, input.commentId, input.reactorId);
      const isActive = await upsertReaction(supabase, existing, input);
      const total = await fetchReactionCount(supabase, input.commentId);

      return { commentId: input.commentId, reactorId: input.reactorId, isActive, total } satisfies ReactionToggleResult;
    },

    async getMutualLikeBanner(viewerId: string, targetId: string): Promise<MutualLikeBanner | null> {
      void viewerId;
      void targetId;
      // TODO: Supabase RPC 또는 뷰를 이용한 상호 좋아요 감지 구현 필요
      return null;
    },
  };
};
