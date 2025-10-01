import type { ReactionRepository } from './ports';
import type { MutualLikeBanner, ReactionToggleInput, ReactionToggleResult } from './types';

export type ReactionServiceDependencies = {
  reactionRepo: ReactionRepository;
};

export type ReactionService = {
  toggleHeart: (input: ReactionToggleInput) => Promise<ReactionToggleResult>;
  getMutualLikeBanner: (viewerId: string, targetId: string) => Promise<MutualLikeBanner | null>;
};

export const createReactionService = (
  deps: ReactionServiceDependencies,
): ReactionService => ({
  async toggleHeart(input) {
    return deps.reactionRepo.toggleHeart(input);
  },
  async getMutualLikeBanner(viewerId, targetId) {
    return deps.reactionRepo.getMutualLikeBanner(viewerId, targetId);
  },
});
