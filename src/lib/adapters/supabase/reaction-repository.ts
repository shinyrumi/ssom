import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './server-client';
import type {
  MutualLikeBanner,
  ReactionRepository,
  ReactionToggleInput,
  ReactionToggleResult,
} from '../../reactions';

type ReactionRow = {
  id: string;
};

type ViewerLikeRow = {
  comment_id: string;
  comments: { id: string; author_id: string } | null;
};

type ViewerCommentLikeRow = {
  comment_id: string;
  reactor_id: string;
  comments: { id: string; author_id: string } | null;
};

type RepositoryOptions = {
  getClient?: () => Promise<SupabaseClient>;
};

const HEART_TYPE = 'heart';

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
    type: HEART_TYPE,
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
    .eq('comment_id', commentId)
    .eq('type', HEART_TYPE);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function fetchMutualLikeBanner(
  supabase: SupabaseClient,
  viewerId: string,
): Promise<MutualLikeBanner | null> {
  const viewerLikesResponse = await supabase
    .from('reactions')
    .select('comment_id, comments!inner(id, author_id)')
    .eq('reactor_id', viewerId)
    .eq('type', HEART_TYPE);

  if (viewerLikesResponse.error) {
    throw new Error(viewerLikesResponse.error.message);
  }

  const viewerCommentLikesResponse = await supabase
    .from('reactions')
    .select('comment_id, reactor_id, comments!inner(id, author_id)')
    .eq('type', HEART_TYPE)
    .eq('comments.author_id', viewerId);

  if (viewerCommentLikesResponse.error) {
    throw new Error(viewerCommentLikesResponse.error.message);
  }

  const likedTargets = new Map<string, string>();
  (viewerLikesResponse.data as ViewerLikeRow[] | null)?.forEach((row) => {
    const targetId = row.comments?.author_id;
    if (targetId && targetId !== viewerId) {
      likedTargets.set(targetId, row.comment_id);
    }
  });

  const mutual = (viewerCommentLikesResponse.data as ViewerCommentLikeRow[] | null)?.find((row) => {
    if (!row.reactor_id || row.reactor_id === viewerId) {
      return false;
    }
    return likedTargets.has(row.reactor_id);
  });

  if (!mutual) {
    return null;
  }

  const targetId = mutual.reactor_id;
  const targetCommentId = likedTargets.get(targetId);
  if (!targetCommentId) {
    return null;
  }

  return {
    viewerId,
    targetId,
    commentId: targetCommentId,
    partnerCommentId: mutual.comment_id,
    activatedAt: new Date().toISOString(),
  } satisfies MutualLikeBanner;
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

    async getMutualLikeBanner(viewerId) {
      if (!viewerId) {
        return null;
      }

      const supabase = await getClient();
      try {
        return await fetchMutualLikeBanner(supabase, viewerId);
      } catch (error) {
        console.error('getMutualLikeBanner error', error);
        return null;
      }
    },
  };
};
