export const FeedSkeleton = () => (
  <section className="space-y-4">
    <div className="h-6 w-40 animate-pulse rounded-full bg-neutral-800" />
    <div className="space-y-2">
      <div className="h-4 w-full animate-pulse rounded-full bg-neutral-800" />
      <div className="h-4 w-3/4 animate-pulse rounded-full bg-neutral-800" />
    </div>
    <div className="space-y-3 pt-3">
      <div className="h-16 w-full animate-pulse rounded-2xl bg-neutral-900" />
      <div className="h-16 w-full animate-pulse rounded-2xl bg-neutral-900" />
    </div>
  </section>
);
