export type ReactionType = 'heart';

export type Reaction = {
  id: string;
  commentId: string;
  reactorId: string;
  type: ReactionType;
  createdAt: string;
};

export type ReactionToggleInput = {
  commentId: string;
  reactorId: string;
};

export type ReactionToggleResult = {
  commentId: string;
  reactorId: string;
  isActive: boolean;
  total: number;
};

export type MutualLikeBanner = {
  viewerId: string;
  targetId: string;
  commentId: string;
  partnerCommentId: string;
  activatedAt: string;
};
