// Storage adapters are no longer needed.
// Supabase manages its own session persistence internally.
// This file is kept for potential future use cases (e.g., caching profile data).

export interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class LocalStorageAdapter implements IStorage {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage full or unavailable
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  }
}

export class SessionStorageAdapter implements IStorage {
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Storage full or unavailable
    }
  }

  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  }
}

export class MemoryStorageAdapter implements IStorage {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

// Default storage instance (kept for backwards compatibility)
export const storage = new LocalStorageAdapter();

export const setStorage = (adapter: IStorage): void => {
  Object.defineProperty(globalThis, "__careeros_storage__", {
    value: adapter,
    writable: true,
    configurable: true,
  });
};

export const getStorage = (): IStorage => {
  if (typeof globalThis !== "undefined" && (globalThis as any).__careeros_storage__) {
    return (globalThis as any).__careeros_storage__;
  }
  return storage;
};
