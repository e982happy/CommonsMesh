/**
 * Incremental synchronization protocol implementation.
 *
 * Implements the sync flow described in protocol/SYNC.md:
 *  1. Requester sends sync.request with bloom filter + latest hashes
 *  2. Responder computes delta set and sends sync.snapshot chunks
 *  3. Requester validates and applies each event via the protocol engine
 */

import type { NetworkNode } from "./types.js";
import { Topics } from "./types.js";

const SYNC_PROTOCOL = "/commonsmesh/sync/1.0.0";
const CHUNK_SIZE = 50; // events per snapshot chunk

export interface SyncAdapter {
  /** Get all event hashes known for a topic */
  getKnownHashes(topic: string): Promise<string[]>;
  /** Get serialized events not in the provided hash set */
  getMissingEvents(topic: string, knownHashes: Set<string>): Promise<string[]>;
  /** Apply a batch of serialized events */
  applyEvents(events: string[]): Promise<{ accepted: number; rejected: number }>;
}

/**
 * Build a simple Bloom filter (bit array) from a set of hashes.
 * Uses 3 hash functions over a 2048-bit array for ~1% false positive rate
 * at up to 200 items.
 */
export function buildBloomFilter(hashes: string[]): string {
  const bits = new Uint8Array(256); // 2048 bits

  for (const hash of hashes) {
    for (let seed = 0; seed < 3; seed++) {
      const pos = simpleHash(hash, seed) % 2048;
      bits[Math.floor(pos / 8)] |= 1 << (pos % 8);
    }
  }

  return Buffer.from(bits).toString("base64");
}

/**
 * Check if a hash is (probably) in the Bloom filter.
 */
export function bloomContains(filterBase64: string, hash: string): boolean {
  const bits = Buffer.from(filterBase64, "base64");
  for (let seed = 0; seed < 3; seed++) {
    const pos = simpleHash(hash, seed) % 2048;
    if (!(bits[Math.floor(pos / 8)] & (1 << (pos % 8)))) return false;
  }
  return true;
}

function simpleHash(str: string, seed: number): number {
  let h = seed * 2654435761;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
  }
  return (h >>> 0);
}

/**
 * Initiate a sync session with a remote peer.
 * Sends a sync.request and processes incoming sync.snapshot chunks.
 */
export async function requestSync(
  node: NetworkNode,
  targetPeerId: string,
  topic: string,
  adapter: SyncAdapter
): Promise<{ received: number; applied: number }> {
  const knownHashes = await adapter.getKnownHashes(topic);
  const bloomFilter = buildBloomFilter(knownHashes);
  const latestHash = knownHashes[knownHashes.length - 1] ?? "genesis";

  const syncRequest = {
    type: "sync.request",
    topic,
    bloom_filter: bloomFilter,
    latest_hashes: { [topic]: latestHash },
    sync_version: "1.0"
  };

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Publish sync request to the peer's inbox topic
  await node.publish(
    Topics.inbox(targetPeerId),
    encoder.encode(JSON.stringify(syncRequest))
  );

  // Subscribe to receive snapshot chunks
  let totalReceived = 0;
  let totalApplied = 0;

  const unsubscribe = await node.subscribe(
    Topics.sync(topic),
    async (data) => {
      try {
        const msg = JSON.parse(decoder.decode(data));
        if (msg.type !== "sync.snapshot" || msg.topic !== topic) return;

        const result = await adapter.applyEvents(msg.events as string[]);
        totalReceived += (msg.events as string[]).length;
        totalApplied += result.accepted;

        if (!msg.has_more) {
          unsubscribe();
        }
      } catch (err) {
        console.warn("[sync] Error processing snapshot chunk:", err);
      }
    }
  );

  return { received: totalReceived, applied: totalApplied };
}

/**
 * Respond to a sync.request from a remote peer.
 * Computes the delta set and sends sync.snapshot chunks.
 */
export async function handleSyncRequest(
  node: NetworkNode,
  requesterId: string,
  topic: string,
  bloomFilterBase64: string,
  adapter: SyncAdapter
): Promise<void> {
  const knownHashes = await adapter.getKnownHashes(topic);
  const knownHashSet = new Set(knownHashes);

  // Find events the requester is missing (not in their Bloom filter)
  const missingEvents = await adapter.getMissingEvents(
    topic,
    new Set(
      knownHashes.filter((h) => bloomContains(bloomFilterBase64, h))
    )
  );

  const encoder = new TextEncoder();

  // Send in chunks
  for (let i = 0; i < missingEvents.length; i += CHUNK_SIZE) {
    const chunk = missingEvents.slice(i, i + CHUNK_SIZE);
    const hasMore = i + CHUNK_SIZE < missingEvents.length;

    const snapshot = {
      type: "sync.snapshot",
      topic,
      events: chunk,
      has_more: hasMore,
      chunk_index: Math.floor(i / CHUNK_SIZE)
    };

    await node.publish(
      Topics.sync(topic),
      encoder.encode(JSON.stringify(snapshot))
    );
  }

  // Send empty snapshot if no events to send
  if (missingEvents.length === 0) {
    const snapshot = {
      type: "sync.snapshot",
      topic,
      events: [],
      has_more: false,
      chunk_index: 0
    };
    await node.publish(
      Topics.sync(topic),
      encoder.encode(JSON.stringify(snapshot))
    );
  }
}
