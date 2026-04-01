import { createHash, generateKeyPairSync, sign as signRaw, verify as verifyRaw, KeyObject } from "node:crypto";
import { canonicalJson } from "./canonical.js";

export function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export interface KeyPair {
  publicKeyPem: string;
  privateKeyPem: string;
}

export function generateEd25519KeyPair(): KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString()
  };
}

export function signObject(object: unknown, privateKeyPem: string): string {
  const payload = canonicalJson(object);
  const signature = signRaw(null, Buffer.from(payload), privateKeyPem);
  return signature.toString("base64");
}

export function verifyObjectSignature(object: unknown, signatureB64: string, publicKeyPem: string): boolean {
  const payload = canonicalJson(object);
  return verifyRaw(null, Buffer.from(payload), publicKeyPem, Buffer.from(signatureB64, "base64"));
}

export function fingerprint(publicKeyPem: string): string {
  return sha256Hex(publicKeyPem).slice(0, 32);
}

export function isKeyObjectLike(value: unknown): value is KeyObject {
  return !!value && typeof value === "object";
}
