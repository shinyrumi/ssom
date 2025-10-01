import type { Thread, ThreadWithMeta } from './types';

export interface ThreadRepository {
  getActiveThread(): Promise<Thread | null>;
  getThreadById(id: string): Promise<Thread | null>;
  listRecent(limit?: number): Promise<ThreadWithMeta[]>;
}
