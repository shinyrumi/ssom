import type { MutualLikeBanner, ReactionToggleInput, ReactionToggleResult } from './types';

export interface ReactionRepository {
  toggleHeart(input: ReactionToggleInput): Promise<ReactionToggleResult>;
  getMutualLikeBanner(viewerId: string, targetId: string): Promise<MutualLikeBanner | null>;
}
