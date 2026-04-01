/**
 * Persistent nonce cache for replay protection.
 * Nonces older than TTL_SEC are automatically evicted.
 */

import type { DB } from "./index.js";

const NONCE_TTL_SEC = 86400; // 24 hours

export function hasNonce(db: DB, userId: string, nonce: string): boolean {
  const row = db
    .prepare("SELECT 1 FROM nonces WHERE user_id = ? AND nonce = ?")
    .get(userId, nonce);
  return !!row;
}

export function recordNonce(db: DB, userId: string, nonce: string): void {
  const nowSec = Math.floor(Date.now() / 1000);
  db.prepare(`
    INSERT OR IGNORE INTO nonces (user_id, nonce, recorded_at)
    VALUES (?, ?, ?)
  `).run(userId, nonce, nowSec);
}

/**
 * Evict nonces older than NONCE_TTL_SEC.
 * Should be called periodically (e.g., once per hour).
 */
export function evictExpiredNonces(db: DB): number {
  const cutoff = Math.floor(Date.now() / 1000) - NONCE_TTL_SEC;
  const result = db
    .prepare("DELETE FROM nonces WHERE recorded_at < ?")
    .run(cutoff);
  return result.changes;
}
