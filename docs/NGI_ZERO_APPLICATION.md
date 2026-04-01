# NGI Zero Commons Fund Application

**Target Call:** NGI Zero Commons Fund (Deadline: April 1st 2026)  
**Project Name:** CommonsMesh  
**Requested Amount:** €45,000  

---

## 1. Abstract

**Can you explain the whole project and its expected outcome(s)?** *(Max 1200 characters)*

CommonsMesh is a local-first, fully decentralized mobile application designed to facilitate community mutual aid, resource matching, and self-organization without relying on central servers. By leveraging a peer-to-peer network (libp2p), CommonsMesh enables users to broadcast their needs, resources, and community motions as cryptographically signed incremental events. 

Each device maintains a local community graph database and embeds a lightweight on-device LLM (~1B parameters, e.g., Qwen2.5/Phi-3.5). This AI acts as a proactive coordinator: it continuously analyzes the local graph to identify direct mutual aid matches, aggregate shared demands for bulk purchasing, and propose skill-exchange projects. 

The expected outcome is a production-ready mobile application and a robust protocol stack (Network, DB, LLM integration) that empowers underserved or time-constrained communities to coordinate effectively. By treating coordination as structured, verifiable state changes rather than noisy chat feeds, CommonsMesh provides a scalable, privacy-preserving digital commons for real-world collective action.

---

## 2. Previous Relevant Experience

**Have you been involved with projects or organisations relevant to this project before?** *(Max 2500 characters)*

*(Please fill in your personal background here. Example below:)*

I am an independent software engineer and researcher with a strong background in decentralized systems and community-driven technology. I have previously contributed to open-source peer-to-peer networking projects and have a deep understanding of cryptographic protocols and local-first architectures.

My experience includes designing secure, anti-Sybil mechanisms for decentralized applications and integrating lightweight AI models into edge devices. I have actively participated in local mutual aid networks, which gave me firsthand insight into the coordination bottlenecks that community organizers face. This practical experience drives the design of CommonsMesh: moving away from chaotic chat groups to a structured, intent-driven protocol that lowers the barrier to community participation.

---

## 3. Compare with Existing Efforts

**Compare your own project with existing or historical efforts. E.g. what is new, more thorough or otherwise different.** *(Max 4000 characters)*

Most existing community coordination relies on centralized platforms like WhatsApp, Discord, or Facebook Groups. While these platforms are excellent for free-form discussion, they fail at actionable coordination. Important needs get lost in the chat scroll, matching resources to needs requires exhausting manual effort from community organizers, and privacy is entirely surrendered to corporate silos.

Historical decentralized efforts (e.g., Mastodon, Secure Scuttlebutt) focus on microblogging and social networking. They replicate the "feed" model but in a federated manner. 

CommonsMesh is fundamentally different in three ways:

1. **Structured State Changes over Chat:** CommonsMesh treats communication not as text messages, but as candidate state changes (e.g., `graph.delta`, `project.motion`, `task.commit`). This creates a queryable "Community Graph" rather than a timeline.
2. **On-Device AI as a Proactive Coordinator:** Instead of forcing users to manually search for help, CommonsMesh uses an embedded, privacy-preserving LLM to analyze the local graph. The AI actively detects patterns—such as three people needing the same tool, or a skill match between two neighbors—and proposes actionable motions. No community data ever leaves the device for AI processing.
3. **Fully Distributed Transport with Sybil Resistance:** Built on libp2p, it requires no central servers. To prevent abuse in a serverless environment, it implements a robust anti-Sybil mechanism combining hardware attestation, social proofs, and a dynamic trust-scoring system, ensuring that high-impact community actions are protected from malicious actors.

---

## 4. Significant Technical Challenges

**What are significant technical challenges you expect to solve during the project?** *(Max 5000 characters)*

Developing a fully decentralized, AI-driven coordination app presents several hard technical challenges that this grant will help solve:

1. **Efficient P2P State Synchronization:** 
   Synchronizing graph states across intermittent mobile connections is notoriously difficult. We are implementing a Bloom filter-based incremental sync protocol over libp2p. The challenge is optimizing the filter size and chunking strategy to minimize bandwidth (targeting ~50 KB/day per user) while ensuring eventual consistency of the cryptographically linked event log.

2. **On-Device LLM Performance on Mobile:** 
   Running a ~1B parameter LLM on mobile devices requires careful memory management and battery optimization. We must integrate `llama.cpp` via React Native (`llama.rn`), ensuring that inference runs smoothly without freezing the UI or draining the battery. Crafting effective prompts that allow a small model to accurately detect complex community matching patterns from JSON graph summaries is a significant applied research challenge.

3. **Sybil Resistance in a Serverless Environment:** 
   Without a central authority to verify identities, preventing Sybil attacks (where one user creates many fake accounts to manipulate votes or trust scores) is critical. We are designing a multi-layered defense: leveraging device-level hardware attestation (e.g., iOS Secure Enclave), building a web of trust (social proofs), and implementing a capability-token system where actions are rate-limited based on a dynamically calculated trust score.

4. **Cryptographic State Integrity:** 
   Ensuring that the distributed event log cannot be tampered with or forked requires a strict linear `chain_hash` mechanism. Handling concurrent offline edits and merging them gracefully without breaking the cryptographic integrity of the project states (motions, intents, assignments) requires a sophisticated Conflict-Free Replicated Data Type (CRDT) approach adapted for signed event envelopes.

---

## 5. Ecosystem and Engagement

**Describe the ecosystem of the project, and how you will engage with relevant actors and promote the outcomes?** *(Max 2500 characters)*

The ecosystem of CommonsMesh consists of local community organizers, mutual aid groups, open-source developers, and privacy advocates. 

To make this project a success, we will engage with:
1. **Local Mutual Aid Networks:** We will partner with existing grassroots organizations (e.g., local transition town initiatives, housing cooperatives) to run pilot deployments. Their feedback will be crucial in refining the UX and the AI matching rules.
2. **The libp2p and Local-First Communities:** By building on libp2p, we contribute back to the decentralized web ecosystem. We will actively share our findings on mobile P2P networking and Bloom filter sync strategies at conferences like FOSDEM and through open-source repositories.
3. **The Open-Source AI Community:** Demonstrating practical, on-device LLM usage for social good provides a strong use case for the local AI movement (e.g., Hugging Face, llama.cpp communities).

Promotion will occur through open development on GitHub, publishing technical deep-dives on decentralized state synchronization and local AI, and direct outreach to digital rights organizations (e.g., APC, EFF) to highlight CommonsMesh as a privacy-preserving alternative to corporate coordination tools. All software, documentation, and protocol specifications will be released under the AGPL-3.0 license, ensuring it remains a true digital commons.

## 6. Budget Explanation and Funding Sources

**Explain what the requested budget will be used for. A breakdown in the main tasks with associated effort is appreciated. Make rates explicit.** *(Max 2500 characters)*

The requested budget of €45,000 will be allocated entirely to the research, development, and initial deployment of CommonsMesh over a 9-month period. There are no other current funding sources for this project.

**Task Breakdown and Effort:**

1. **Protocol Hardening & Sybil Resistance (Month 1-2): €10,000**
   - Finalizing the cryptographic event envelope and capability token system.
   - Implementing hardware attestation and dynamic trust scoring.
   - *Effort: 200 hours @ €50/hr.*

2. **Network Layer & P2P Sync (Month 3-4): €10,000**
   - Developing the libp2p node factory (TCP, WS, mDNS, GossipSub).
   - Implementing the Bloom filter-based incremental sync protocol.
   - *Effort: 200 hours @ €50/hr.*

3. **On-Device LLM Integration (Month 5-6): €10,000**
   - Integrating `llama.rn` for local inference.
   - Developing the two-stage matching engine (rule-based + LLM-powered).
   - Prompt engineering and optimization for ~1B parameter models.
   - *Effort: 200 hours @ €50/hr.*

4. **Mobile App Development & UX (Month 7-8): €10,000**
   - Building the React Native (Expo) application.
   - Designing the Community Graph UI and actionable motion interfaces.
   - Implementing secure keychain storage for Ed25519 keys.
   - *Effort: 200 hours @ €50/hr.*

5. **Security Audit Preparation, Documentation & Pilot (Month 9): €5,000**
   - Writing comprehensive technical documentation and user guides.
   - Conducting a pilot deployment with a local mutual aid group.
   - Preparing the codebase for an independent security audit.
   - *Effort: 100 hours @ €50/hr.*

**Total Requested: €45,000**

All outcomes, including the mobile app, protocol specifications, and embedded LLM integration code, will be published under the AGPL-3.0 open-source license. We are committed to maintaining the project as a true digital commons.
