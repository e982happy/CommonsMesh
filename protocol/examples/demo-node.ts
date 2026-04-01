import { createEngine } from "../src/engine.js";
import { generateEd25519KeyPair, signObject, sha256Hex } from "../src/crypto.js";
import type { CapabilityToken, MessageEnvelope } from "../src/types.js";

function now(): number {
  return Math.floor(Date.now() / 1000);
}

function makeCapability(issuer: string, holder: string, issuerPrivateKeyPem: string): CapabilityToken {
  const unsignedToken = {
    capability_id: "cap_demo_001",
    issuer,
    holder,
    scope: {
      project_id: "proj_456"
    },
    rights: ["propose", "comment", "vote", "read"],
    constraints: {
      max_count: 10,
      expires_at: now() + 86400,
      requires_ack: false
    },
    valid_from: now() - 60,
    valid_to: now() + 86400,
    nonce: "cap_nonce_001"
  };

  const token: CapabilityToken = {
    ...unsignedToken,
    signature: signObject(unsignedToken, issuerPrivateKeyPem)
  };

  return token;
}

function makeMessage<TPayload extends Record<string, unknown>>(
  kind: MessageEnvelope<TPayload>["kind"],
  sender: {
    user_id: string;
    device_id: string;
    agent_id: string;
    app_id: string;
    user_pubkey: string;
    device_pubkey: string;
    agent_pubkey: string;
  },
  capabilityToken: CapabilityToken,
  payload: TPayload,
  privateKeyPem: string,
  prevEventHash = "genesis"
): MessageEnvelope<TPayload> {
  const envelopeWithoutSignature = {
    msg_id: crypto.randomUUID(),
    protocol_version: "1.0" as const,
    kind,
    created_at: now(),
    sender,
    attestation: {
      app_build_hash: "sha256:demo",
      manifest_hash: "sha256:demo",
      attestation_type: "software" as const,
      attestation_proof: "demo-proof"
    },
    authz: {
      capability_token: capabilityToken,
      scope: {
        visibility: "project" as const,
        target_mode: "group" as const,
        target_ref: "proj_456"
      },
      valid_from: now() - 60,
      valid_to: now() + 86400,
      nonce: crypto.randomUUID(),
      prev_event_hash: prevEventHash
    },
    integrity: {
      payload_hash: sha256Hex(JSON.stringify(payload)),
      chain_hash: ""
    },
    payload
  };

  const signature = signObject(envelopeWithoutSignature, privateKeyPem);
  return {
    ...envelopeWithoutSignature,
    integrity: {
      ...envelopeWithoutSignature.integrity,
      signature,
      chain_hash: sha256Hex(signature + envelopeWithoutSignature.integrity.payload_hash)
    }
  };
}

async function main() {
  const engine = createEngine();
  const keys = generateEd25519KeyPair();

  const sender = {
    user_id: "did:peer:alice",
    device_id: "dev_alice",
    agent_id: "agent_alice",
    app_id: "app_build_001",
    user_pubkey: keys.publicKeyPem,
    device_pubkey: keys.publicKeyPem,
    agent_pubkey: keys.publicKeyPem
  };

  const cap = makeCapability(sender.user_id, sender.user_id, keys.privateKeyPem);

  const motion = makeMessage(
    "project.motion",
    sender,
    cap,
    {
      motion_id: "motion_001",
      title: "Weekend community cleanup",
      goal: "Organize 20 people to clean the neighborhood",
      scope: {
        geo: "community-local",
        community_tags: ["public_service", "mutual_aid"]
      },
      requested_roles: [
        { role: "coordinator", count: 1 },
        { role: "recruiter", count: 2 },
        { role: "on_site_worker", count: 12 }
      ],
      requirements: {
        availability: ["saturday_morning"],
        capabilities: ["local_presence"],
        trust_min: 0.5
      },
      expected_benefit: {
        public: "cleaner neighborhood",
        member: "community reputation"
      },
      decision_deadline: now() + 3600
    },
    keys.privateKeyPem
  );

  const result = engine.process(motion);
  console.log("motion result:", result);

  const state = engine.state;
  console.log("projects:", Array.from(state.projects.values()).map((p) => ({
    project_id: p.project_id,
    status: p.status,
    progress: p.progress,
    intents: p.intents.size,
    tasks: p.tasks.size
  })));
  console.log("graph nodes:", state.graph.nodes.size);
  console.log("graph edges:", state.graph.edges.size);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
