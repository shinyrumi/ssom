import type { ThreadRepository } from './ports';
import type { Thread } from './types';

export type ThreadServiceDependencies = {
  threadRepo: ThreadRepository;
};

export type ThreadService = {
  getActiveThread: () => Promise<Thread | null>;
  getThreadOrLatestFallback: () => Promise<Thread | null>;
};

export const createThreadService = (
  deps: ThreadServiceDependencies,
): ThreadService => ({
  async getActiveThread() {
    return deps.threadRepo.getActiveThread();
  },
  async getThreadOrLatestFallback() {
    const active = await deps.threadRepo.getActiveThread();
    if (active) {
      return active;
    }

    const [latest] = await deps.threadRepo.listRecent(1);
    return latest ?? null;
  },
});
