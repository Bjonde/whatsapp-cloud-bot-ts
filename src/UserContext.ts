/**
 * User Context Management
 *
 * @deprecated The built-in in-memory context store has been **removed**. It grew
 * unbounded (one entry per user, never evicted) and did not work across
 * multiple processes/instances. The `context` parameter passed to handlers is
 * now always `undefined`.
 *
 * Manage conversation state in your own store (e.g. Redis/Postgres), keyed by
 * the user's phone number (`update.userPhoneNumber`). The exports below remain
 * only so existing imports keep compiling and will be removed in a future
 * major version.
 */

import type { UserContextData } from './types/index.js';

/**
 * @deprecated In-memory, non-persistent scratch space. The library no longer
 * creates or injects this. State stored here is local to the instance and is
 * **not** shared across messages or persisted anywhere. Use your own store.
 */
export class UserContext {
  /** Instance-local data bag. */
  public userData: UserContextData = {};

  // The phone number is accepted for constructor-signature compatibility only.
  constructor(_phoneNumber?: string) {}

  /** @deprecated Sets a value on this instance only. */
  set(key: string, value: any): void {
    this.userData[key] = value;
  }

  /** @deprecated Reads a value from this instance only. */
  get<T = any>(key: string, defaultValue?: T): T | undefined {
    return this.userData[key] !== undefined ? this.userData[key] : defaultValue;
  }

  /** @deprecated */
  has(key: string): boolean {
    return key in this.userData;
  }

  /** @deprecated */
  delete(key: string): void {
    delete this.userData[key];
  }

  /** @deprecated Clears this instance's data. */
  clear(): void {
    this.userData = {};
  }

  /** @deprecated */
  keys(): string[] {
    return Object.keys(this.userData);
  }

  /** @deprecated */
  size(): number {
    return Object.keys(this.userData).length;
  }
}

/**
 * @deprecated No-op. The global context store has been removed.
 */
export function clearAllContexts(): void {
  // no-op — retained for backwards compatibility
}

/**
 * @deprecated Always returns an empty array. The global context store has been
 * removed.
 */
export function getAllContextUsers(): string[] {
  return [];
}
