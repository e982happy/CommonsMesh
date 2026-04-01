/**
 * Transport adapter placeholder.
 *
 * This file intentionally keeps libp2p wiring separate from the core protocol
 * so the protocol engine can evolve independently.
 *
 * When you wire this up with the current js-libp2p stack, the official docs
 * use ESM-only modules and show `createLibp2p(...)`-based configuration.
 * The DHT service also relies on `identify` to discover peers that support
 * the protocol. See the official js-libp2p configuration documentation.
 * https://github.com/libp2p/js-libp2p
 *
 * This repository does not pin a specific libp2p version here on purpose.
 * Install the transport packages you want in the application layer.
 */

export interface TransportPeer {
  peerId: string;
  multiaddrs: string[];
}

export interface TransportNode {
  start(): Promise<void>;
  stop(): Promise<void>;
  dial(peerId: string): Promise<void>;
  publish(topic: string, data: Uint8Array): Promise<void>;
  subscribe(topic: string, onMessage: (data: Uint8Array) => void): Promise<() => void>;
}

/**
 * Replace this with a real libp2p node factory in the app package.
 */
export function createTransportNode(): TransportNode {
  return {
    async start() {
      return;
    },
    async stop() {
      return;
    },
    async dial(_peerId: string) {
      return;
    },
    async publish(_topic: string, _data: Uint8Array) {
      return;
    },
    async subscribe(_topic: string, _onMessage: (data: Uint8Array) => void) {
      return () => void 0;
    }
  };
}
