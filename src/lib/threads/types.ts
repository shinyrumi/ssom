export type Thread = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  isActive: boolean;
};

export type ThreadWithMeta = Thread & {
  commentCount: number;
};
