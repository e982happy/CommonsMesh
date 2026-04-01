/**
 * CommonsMesh libp2p network node factory.
 *
 * This module creates a fully configured libp2p node with:
 *  - TCP + WebSockets transports
 *  - Noise encryption
 *  - Yamux stream multiplexing
 *  - Kademlia DHT for peer discovery and routing
 *  - GossipSub for topic-based pubsub
 *  - mDNS for local network peer discovery
 *  - Circuit relay v2 for NAT traversal
 *  - Identify protocol for capability advertisement
 *
 * Install dependencies:
 *   pnpm add libp2p @libp2p/tcp @libp2p/websockets @libp2p/noise
 *            @libp2p/yamux @libp2p/kad-dht @libp2p/gossipsub
 *            @libp2p/mdns @libp2p/circuit-relay-v2
 *            @libp2p/identify @libp2p/peer-id-factory
 *            @multiformats/multiaddr
 */

import type { Libp2p } from "libp2p";
import type { PeerId } from "@libp2p/interface";
import type { NetworkNodeConfig, NetworkNode } from "./types.js";

/**
 * Create a CommonsMesh libp2p node.
 *
 * @param config - Node configuration (listen addresses, bootstrap peers, etc.)
 * @returns A NetworkNode wrapping the libp2p instance.
 */
export async function createNetworkNode(config: NetworkNodeConfig): Promise<NetworkNode> {
  // Dynamic imports allow the mobile app to tree-shake unused transports
  const { createLibp2p } = await import("libp2p");
  const { tcp } = await import("@libp2p/tcp");
  const { webSockets } = await import("@libp2p/websockets");
  const { noise } = await import("@libp2p/noise");
  const { yamux } = await import("@libp2p/yamux");
  const { kadDHT } = await import("@libp2p/kad-dht");
  const { gossipsub } = await import("@libp2p/gossipsub");
  const { mdns } = await import("@libp2p/mdns");
  const { circuitRelayTransport, circuitRelayServer } = await import("@libp2p/circuit-relay-v2");
  const { identify } = await import("@libp2p/identify");

  const listenAddresses = config.listenAddresses ?? [
    "/ip4/0.0.0.0/tcp/0",
    "/ip4/0.0.0.0/tcp/0/ws"
  ];

  const node: Libp2p = await createLibp2p({
    addresses: {
      listen: listenAddresses
    },
    transports: [
      tcp(),
      webSockets(),
      circuitRelayTransport({ discoverRelays: 2 })
    ],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      identify: identify(),
      dht: kadDHT({
        protocol: "/commonsmesh/kad/1.0.0",
        clientMode: config.dhtClientMode ?? true
      }),
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
        emitSelf: false,
        // Flood publish for small community networks
        floodPublish: true
      }),
      relay: circuitRelayServer({ reservations: { maxReservations: 128 } }),
      mdns: mdns({ interval: 20000 })
    }
  });

  // Connect to bootstrap peers
  if (config.bootstrapPeers?.length) {
    for (const addr of config.bootstrapPeers) {
      try {
        const { multiaddr } = await import("@multiformats/multiaddr");
        await node.dial(multiaddr(addr));
      } catch (err) {
        console.warn(`[network] Failed to connect to bootstrap peer ${addr}:`, err);
      }
    }
  }

  return wrapNode(node);
}

function wrapNode(node: Libp2p): NetworkNode {
  return {
    peerId(): PeerId {
      return node.peerId;
    },

    multiaddrs(): string[] {
      return node.getMultiaddrs().map((ma) => ma.toString());
    },

    async start(): Promise<void> {
      await node.start();
      console.log("[network] Node started. PeerID:", node.peerId.toString());
      console.log("[network] Listening on:", node.getMultiaddrs().map((ma) => ma.toString()));
    },

    async stop(): Promise<void> {
      await node.stop();
      console.log("[network] Node stopped.");
    },

    async publish(topic: string, data: Uint8Array): Promise<void> {
      const pubsub = (node.services as any).pubsub;
      await pubsub.publish(topic, data);
    },

    async subscribe(
      topic: string,
      onMessage: (data: Uint8Array, from: string) => void
    ): Promise<() => void> {
      const pubsub = (node.services as any).pubsub;
      const handler = (event: any) => {
        onMessage(event.detail.data, event.detail.from.toString());
      };
      pubsub.subscribe(topic);
      pubsub.addEventListener("message", handler);
      return () => {
        pubsub.unsubscribe(topic);
        pubsub.removeEventListener("message", handler);
      };
    },

    async dial(peerId: string): Promise<void> {
      const { peerIdFromString } = await import("@libp2p/peer-id");
      await node.dial(peerIdFromString(peerId));
    },

    peers(): string[] {
      return node.getPeers().map((p) => p.toString());
    },

    async findPeer(peerId: string): Promise<string[]> {
      try {
        const { peerIdFromString } = await import("@libp2p/peer-id");
        const dht = (node.services as any).dht;
        const peerInfo = await dht.findPeer(peerIdFromString(peerId));
        return peerInfo.multiaddrs.map((ma: any) => ma.toString());
      } catch {
        return [];
      }
    },

    async provide(key: string): Promise<void> {
      const { CID } = await import("multiformats/cid");
      const { sha256 } = await import("multiformats/hashes/sha2");
      const encoder = new TextEncoder();
      const hash = await sha256.digest(encoder.encode(key));
      const cid = CID.createV1(0x55, hash);
      const dht = (node.services as any).dht;
      await dht.provide(cid);
    },

    async findProviders(key: string): Promise<string[]> {
      const { CID } = await import("multiformats/cid");
      const { sha256 } = await import("multiformats/hashes/sha2");
      const encoder = new TextEncoder();
      const hash = await sha256.digest(encoder.encode(key));
      const cid = CID.createV1(0x55, hash);
      const dht = (node.services as any).dht;
      const providers: string[] = [];
      for await (const provider of dht.findProviders(cid)) {
        providers.push(provider.id.toString());
      }
      return providers;
    }
  };
}
