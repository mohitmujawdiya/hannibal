/**
 * Chat persistence adapter — swappable interface.
 * Tier 1: localStorage (current)
 * Tier 2: Postgres via API routes (future)
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content?: string;
  parts?: unknown[];
  metadata?: unknown;
}

export interface ChatStore {
  load(projectId: string): ChatMessage[];
  save(projectId: string, messages: ChatMessage[]): void;
  clear(projectId: string): void;
}

const STORAGE_PREFIX = "hannibal:chat:";
const MAX_MESSAGES = 200;

export const localChatStore: ChatStore = {
  load(projectId) {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + projectId);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  save(projectId, messages) {
    if (typeof window === "undefined") return;
    try {
      const trimmed = messages.length > MAX_MESSAGES
        ? messages.slice(-MAX_MESSAGES)
        : messages;
      localStorage.setItem(STORAGE_PREFIX + projectId, JSON.stringify(trimmed));
    } catch {
      // quota exceeded — silently drop
    }
  },

  clear(projectId) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_PREFIX + projectId);
  },
};
