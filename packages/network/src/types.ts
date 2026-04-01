import type { PeerId } from "@libp2p/interface";

export interface NetworkNodeConfig {
  /** Multiaddr strings to listen on. Defaults to TCP + WS on random ports. */
  listenAddresses?: string[];
  /** Bootstrap peer multiaddrs for initial DHT seeding */
  bootstrapPeers?: string[];
  /** Run DHT in client mode (no server responsibilities). Default: true */
  dhtClientMode?: boolean;
  /** Path to persistent peer store (optional) */
  peerStorePath?: string;
}

export interface NetworkNode {
  peerId(): PeerId;
  multiaddrs(): string[];
  start(): Promise<void>;
  stop(): Promise<void>;
  publish(topic: string, data: Uint8Array): Promise<void>;
  subscribe(
    topic: string,
    onMessage: (data: Uint8Array, from: string) => void
  ): Promise<() => void>;
  dial(peerId: string): Promise<void>;
  peers(): string[];
  findPeer(peerId: string): Promise<string[]>;
  provide(key: string): Promise<void>;
  findProviders(key: string): Promise<string[]>;
}

/** CommonsMesh pubsub topic naming conventions */
export const Topics = {
  /** Global broadcast for community-wide announcements */
  global: "commonsmesh/global/1.0",
  /** Per-project topic: commonsmesh/project/<projectId>/1.0 */
  project: (projectId: string) => `commonsmesh/project/${projectId}/1.0`,
  /** Per-user inbox: commonsmesh/inbox/<userId>/1.0 */
  inbox: (userId: string) => `commonsmesh/inbox/${userId}/1.0`,
  /** Sync topic for a community/region */
  sync: (communityId: string) => `commonsmesh/sync/${communityId}/1.0`
} as const;
