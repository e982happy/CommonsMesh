/**
 * Event log persistence layer.
 *
 * The event log is the source of truth. All other tables are materialized views
 * that can be rebuilt by replaying the event log.
 */

import type { DB, EventRow } from "./index.js";
import { canonicalJson, sha256Hex } from "@commonsmesh/protocol";
import type { MessageEnvelope } from "@commonsmesh/protocol";

export function appendEvent(db: DB, msg: MessageEnvelope): void {
  const rawJson = canonicalJson(msg);
  const eventHash = sha256Hex(rawJson);

  db.prepare(`
    INSERT OR IGNORE INTO events
      (event_hash, chain_hash, msg_id, kind, created_at, sender_id, topic_ref, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventHash,
    msg.integrity.chain_hash,
    msg.msg_id,
    msg.kind,
    msg.created_at,
    msg.sender.user_id,
    msg.authz.scope.target_ref,
    rawJson
  );
}

export function getEventByHash(db: DB, eventHash: string): MessageEnvelope | null {
  const row = db
    .prepare("SELECT raw_json FROM events WHERE event_hash = ?")
    .get(eventHash) as { raw_json: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.raw_json) as MessageEnvelope;
}

export function getEventsByTopic(
  db: DB,
  topicRef: string,
  afterHash?: string
): MessageEnvelope[] {
  let rows: { raw_json: string }[];

  if (afterHash) {
    // Find the id of the afterHash event and return all events after it
    const anchor = db
      .prepare("SELECT id FROM events WHERE chain_hash = ? OR event_hash = ?")
      .get(afterHash, afterHash) as { id: number } | undefined;

    if (anchor) {
      rows = db
        .prepare(
          "SELECT raw_json FROM events WHERE topic_ref = ? AND id > ? ORDER BY id ASC"
        )
        .all(topicRef, anchor.id) as { raw_json: string }[];
    } else {
      rows = db
        .prepare("SELECT raw_json FROM events WHERE topic_ref = ? ORDER BY id ASC")
        .all(topicRef) as { raw_json: string }[];
    }
  } else {
    rows = db
      .prepare("SELECT raw_json FROM events WHERE topic_ref = ? ORDER BY id ASC")
      .all(topicRef) as { raw_json: string }[];
  }

  return rows.map((r) => JSON.parse(r.raw_json) as MessageEnvelope);
}

export function getAllEventHashes(db: DB, topicRef: string): string[] {
  const rows = db
    .prepare("SELECT event_hash FROM events WHERE topic_ref = ? ORDER BY id ASC")
    .all(topicRef) as { event_hash: string }[];
  return rows.map((r) => r.event_hash);
}

export function getLatestChainHash(db: DB, topicRef: string): string {
  const row = db
    .prepare(
      "SELECT chain_hash FROM events WHERE topic_ref = ? ORDER BY id DESC LIMIT 1"
    )
    .get(topicRef) as { chain_hash: string } | undefined;
  return row?.chain_hash ?? "genesis";
}

export function countEvents(db: DB, topicRef?: string): number {
  if (topicRef) {
    const row = db
      .prepare("SELECT COUNT(*) as cnt FROM events WHERE topic_ref = ?")
      .get(topicRef) as { cnt: number };
    return row.cnt;
  }
  const row = db
    .prepare("SELECT COUNT(*) as cnt FROM events")
    .get() as { cnt: number };
  return row.cnt;
}
