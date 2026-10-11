type AttemptEntry = {
  count: number;
  first: number;
};

export interface LoginAttemptStore {
  get(email: string, now: number): AttemptEntry;
  increment(email: string, now: number): void;
  clear(email: string): void;
}

export function createInMemoryLoginAttemptStore(windowMinutes: number): LoginAttemptStore {
  const entries = new Map<string, AttemptEntry>();
  const windowMs = windowMinutes * 60 * 1000;

  return {
    get(email, now) {
      const current = entries.get(email) || { count: 0, first: now };
      if (now - current.first > windowMs) return { count: 0, first: now };
      return current;
    },

    increment(email, now) {
      const current = entries.get(email);
      if (!current || now - current.first > windowMs) {
        entries.set(email, { count: 1, first: now });
        return;
      }

      entries.set(email, { count: current.count + 1, first: current.first });
    },

    clear(email) {
      entries.delete(email);
    },
  };
}
