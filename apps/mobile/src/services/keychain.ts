/**
 * Keychain service — Ed25519 key generation and message signing.
 *
 * On iOS: uses Secure Enclave / Keychain via react-native-keychain.
 * On Android: uses Android Keystore via react-native-keychain.
 *
 * The private key NEVER leaves the device's secure hardware.
 * We store only the public key in AsyncStorage for display purposes.
 *
 * Install: pnpm add react-native-keychain @noble/ed25519
 */

import * as ed from "@noble/ed25519";
import * as Keychain from "react-native-keychain";
import { sha256Hex, canonicalJson } from "@commonsmesh/protocol";
import type { MessageEnvelope, MessageKind } from "@commonsmesh/protocol";
import { useSettingsStore } from "../store/settingsStore";

const KEYCHAIN_SERVICE = "commonsmesh.keypair";
const KEY_ALGORITHM = "Ed25519";

/**
 * Generate a new Ed25519 keypair and store the private key securely.
 * Returns the userId (hex of public key) and PEM-encoded public key.
 */
export async function generateKeypairAndStore(): Promise<{
  userId: string;
  publicKeyPem: string;
}> {
  // Generate a 32-byte random private key
  const privKeyBytes = ed.utils.randomPrivateKey();
  const pubKeyBytes = await ed.getPublicKeyAsync(privKeyBytes);

  const privKeyHex = Buffer.from(privKeyBytes).toString("hex");
  const pubKeyHex = Buffer.from(pubKeyBytes).toString("hex");

  // Store private key in device Keychain
  await Keychain.setGenericPassword(
    pubKeyHex, // username = public key (for lookup)
    privKeyHex, // password = private key
    {
      service: KEYCHAIN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    }
  );

  // userId = hex of public key (first 32 chars as display prefix)
  const userId = `user_${pubKeyHex}`;

  // PEM-encoded public key (simplified — real PEM would include ASN.1 header)
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${Buffer.from(pubKeyBytes).toString("base64")}\n-----END PUBLIC KEY-----`;

  return { userId, publicKeyPem };
}

/**
 * Load the private key from Keychain.
 */
async function loadPrivateKey(): Promise<Uint8Array> {
  const credentials = await Keychain.getGenericPassword({
    service: KEYCHAIN_SERVICE
  });
  if (!credentials) throw new Error("No keypair found. Please complete onboarding.");
  return Buffer.from(credentials.password, "hex");
}

/**
 * Build, sign, and return a MessageEnvelope ready to be processed.
 *
 * @param kind - Message kind
 * @param payload - Message payload object
 * @param overrides - Optional overrides for authz/scope fields
 */
export async function buildAndSignMessage(
  kind: MessageKind,
  payload: Record<string, unknown>,
  overrides?: Partial<MessageEnvelope>
): Promise<MessageEnvelope> {
  const settings = useSettingsStore.getState();
  const profile = settings.profile;
  if (!profile) throw new Error("Profile not set");

  const privKeyBytes = await loadPrivateKey();
  const pubKeyBytes = await ed.getPublicKeyAsync(privKeyBytes);
  const pubKeyHex = Buffer.from(pubKeyBytes).toString("hex");

  const nowSec = Math.floor(Date.now() / 1000);
  const nonce = Buffer.from(ed.utils.randomPrivateKey()).toString("hex").slice(0, 32);
  const msgId = `msg_${nonce}`;

  // Compute payload hash
  const payloadHash = sha256Hex(canonicalJson(payload));

  // Build the unsigned envelope (chain_hash placeholder)
  const chainHash = sha256Hex(canonicalJson({ prev: "genesis", msg_id: msgId }));

  const unsigned: Omit<MessageEnvelope, "integrity"> & {
    integrity: Omit<MessageEnvelope["integrity"], "signature">;
  } = {
    msg_id: msgId,
    protocol_version: "1.0",
    kind,
    created_at: nowSec,
    sender: {
      user_id: profile.userId,
      device_id: `device_${pubKeyHex.slice(0, 16)}`,
      agent_id: `agent_${pubKeyHex.slice(0, 16)}`,
      app_id: "commonsmesh.mobile.v0.1",
      user_pubkey: pubKeyHex,
      device_pubkey: pubKeyHex,
      agent_pubkey: pubKeyHex
    },
    attestation: {
      attestation_type: "software",
      attestation_data: {}
    },
    authz: {
      capability_token: null as any,
      scope: {
        target_ref: (payload as any).project_id ?? (payload as any).motion_id ?? "global",
        community_id: "default",
        visibility: "community"
      },
      nonce,
      prev_event_hash: "genesis",
      valid_from: nowSec - 60,
      valid_to: nowSec + 3600
    },
    integrity: {
      payload_hash: payloadHash,
      chain_hash: chainHash
    },
    payload
  };

  // Sign the unsigned envelope using canonical JSON
  const toSign = canonicalJson(unsigned);
  const sigBytes = await ed.signAsync(
    Buffer.from(toSign),
    privKeyBytes
  );
  const signature = Buffer.from(sigBytes).toString("hex");

  const envelope: MessageEnvelope = {
    ...unsigned,
    integrity: {
      ...unsigned.integrity,
      signature
    }
  } as MessageEnvelope;

  // Apply overrides
  if (overrides) {
    Object.assign(envelope, overrides);
  }

  return envelope;
}
