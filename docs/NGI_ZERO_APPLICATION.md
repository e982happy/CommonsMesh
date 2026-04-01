# NGI Zero Commons Fund Application

**Target Call:** NGI Zero Commons Fund (Deadline: April 1st 2026)  
**Project Name:** CommonsMesh  
**Requested Amount:** €45,000  

---

## 1. Abstract

**Can you explain the whole project and its expected outcome(s)?** *(Max 1200 characters)*

CommonsMesh is a local-first mobile application developed for grassroots mutual aid and community organizing, operating entirely without central servers.

Currently, community groups rely heavily on platforms like WhatsApp or Facebook. Critical needs get lost in chat histories, and privacy is non-existent. CommonsMesh addresses this by establishing a peer-to-peer network (libp2p) directly between mobile devices. When a participant requires a tool, offers a skill, or proposes a community project, the application broadcasts this as a cryptographically signed event. 

Instead of generating a noisy chat feed, the system constructs a local "community graph" database on each device. A small, efficient LLM (such as Qwen2.5 1B) is embedded directly into the application to run locally. This AI continuously analyzes the local graph to identify matching needs, suggest group purchases, or assist in dividing tasks for community projects—ensuring no data ever leaves the user's phone.

The expected outcome is a production-ready mobile application and a reusable P2P protocol stack. It provides marginalized and resource-constrained communities with a secure, private, and highly efficient method to coordinate real-world action, transforming collective needs into structured, actionable steps.

---

## 2. Previous Relevant Experience

**Have you been involved with projects or organisations relevant to this project before?** *(Max 2500 characters)*

The applicant's background combines software engineering with architectural field research, providing a unique perspective on community infrastructure. 

For the past five years, the applicant has worked as a software developer at a smart glasses company. This role required developing highly proficient skills in writing efficient, resource-constrained code that runs on edge devices. Optimizing software for hardware with limited battery and processing power is the exact skill set required to successfully run local LLMs and P2P sync protocols on mobile phones.

Prior to entering the technology sector, the applicant's undergraduate and graduate studies focused on architecture. During that period, months were spent conducting intensive field research in marginalized communities, both domestically and internationally. A particularly formative experience involved working in Port Moresby, Papua New Guinea, assisting in the design of affordable housing and engaging directly with informal settlement communities. 

Spending time in these settlements revealed how people survive on the margins: through dense, informal networks of mutual aid and shared resources. These communities do not need another social network; they require tools that respect their limited resources (such as intermittent internet access) and facilitate the coordination of physical goods, labor, and collective bargaining power. 

While the applicant's background may not include a long history in cryptographic protocol design, the combination of edge computing experience and a deep, firsthand understanding of what underserved communities require to self-organize is the driving force behind CommonsMesh. Technical skills are being applied to resolve the coordination bottlenecks observed firsthand in Port Moresby and other communities.

---

## 3. Compare with Existing Efforts

**Compare your own project with existing or historical efforts. E.g. what is new, more thorough or otherwise different.** *(Max 4000 characters)*

An examination of how communities organize today reveals an almost exclusive reliance on centralized platforms like WhatsApp, Discord, or Facebook Groups. These tools are excellent for conversation but highly ineffective for coordination. A request for assistance easily gets buried under numerous other messages. The burden of matching individuals who possess resources with those who need them falls entirely on exhausted community organizers. Furthermore, these communities are surrendering their social graph data to technology corporations.

Decentralized alternatives such as Mastodon or Secure Scuttlebutt exist, but they largely replicate the "social feed" model in a federated manner. They remain optimized for broadcasting thoughts rather than organizing labor or sharing resources.

CommonsMesh adopts a fundamentally different approach. 

First, communication is not treated as text messages, but as state changes. When a user interacts with the application, they publish structured intents—such as `graph.delta` (indicating a need for a ladder) or `project.motion` (proposing a park cleanup). This approach builds a queryable database of community capacity, rather than a timeline of chatter.

Second, the application assumes the heavy lifting of coordination. By running a lightweight LLM locally on the device, the system can analyze the community graph and proactively suggest actions. For instance, it might identify that three neighbors require the same building materials and recommend a bulk order, or notice that one user needs moving boxes while another recently finished moving. It functions as an automated, privacy-respecting community organizer.

Finally, the system is designed for the reality of marginalized communities. It does not assume access to a fast, always-on internet connection or the ability to rent a server. It synchronizes directly phone-to-phone over libp2p when connections are available, ensuring resilience in areas where infrastructure is unreliable.

---

## 4. Significant Technical Challenges

**What are significant technical challenges you expect to solve during the project?** *(Max 5000 characters)*

Developing this system requires solving several complex problems, primarily concerning the integration of edge computing and P2P networks on mobile devices.

1. **Running LLMs on Mobile Devices:** 
   Executing a 1B parameter model on a mid-range Android phone without draining the battery or freezing the UI is a significant challenge. The integration of `llama.cpp` via React Native (`llama.rn`) is planned. The difficulty lies not merely in execution, but in crafting the appropriate prompts so a small model can accurately extract matching patterns from JSON graph data. The inference pipeline must be heavily optimized to run only when the phone is idle or plugged in.

2. **Efficient State Sync over P2P:** 
   Mobile devices frequently go offline. When two nodes finally connect, they must determine missing events without transferring the entire database. A sync protocol over libp2p using Bloom filters is being developed. The technical hurdle involves tuning the filter size to minimize bandwidth (targeting under 50 KB/day per user) while still guaranteeing that the cryptographically linked event log eventually achieves consistency across the neighborhood.

3. **Preventing Abuse Without Central Servers:** 
   In the absence of a central server to ban malicious actors, preventing Sybil attacks (where numerous fake accounts are created to spam the network) is a critical issue. A pragmatic approach is being taken. Instead of relying on heavy blockchain consensus, a combination of device-level hardware attestation (proving the device is real) and a local web-of-trust scoring system is utilized. If an account begins spamming, its local trust score decreases, and other nodes will simply drop its packets. Implementing this logic to protect the network without excluding legitimate new users requires careful balancing.

4. **Handling Concurrent Edits in a Graph:** 
   If two individuals accept the same community task while offline, the network must resolve that conflict gracefully upon reconnection. A CRDT (Conflict-Free Replicated Data Type) approach adapted for signed event envelopes is being implemented. This ensures the UI reflects the reality of the community state without compromising the cryptographic chain of events.

---

## 5. Ecosystem and Engagement

**Describe the ecosystem of the project, and how you will engage with relevant actors and promote the outcomes?** *(Max 2500 characters)*

The ecosystem surrounding CommonsMesh includes grassroots organizers, the local-first software community, and open-source AI developers.

To ensure the system functions effectively for individuals on the ground, development will not occur in isolation. Partnerships with local mutual aid networks and housing cooperatives are planned to run pilot deployments. Background experience in community research has demonstrated that failing to test with actual end-users early in the process leads to building the wrong solution. Their feedback will directly shape the UI and the AI matching logic.

Technically, the project relies heavily on the libp2p ecosystem. Findings will be contributed back to that community, particularly concerning mobile P2P networking and efficient Bloom filter syncing, which are recognized challenges in the field. 

Engagement with the open-source AI community (such as the Hugging Face and llama.cpp ecosystems) is also planned. Demonstrating that local, small-parameter models can be utilized for concrete social good—rather than merely as chatbots—provides a compelling use case likely to attract contributors.

All developments will be open-sourced under the AGPL-3.0 license. Protocol specifications will be clearly documented to allow other developers to build compatible clients or relay nodes, facilitating the growth of this system into a true piece of digital commons infrastructure.

---

## 6. Budget Explanation and Funding Sources

**Explain what the requested budget will be used for. A breakdown in the main tasks with associated effort is appreciated. Make rates explicit.** *(Max 2500 characters)*

A budget of €45,000 is requested to fund the research, development, and pilot deployment of CommonsMesh over a 9-month period. The project is being developed independently and currently has no other funding sources.

**Task Breakdown:**

1. **Protocol and Sybil Resistance Logic (Months 1-2): €10,000**
   - Finalizing the event schema and cryptographic signing logic.
   - Implementing the local trust scoring and hardware attestation checks.
   - *Effort: 200 hours @ €50/hr.*

2. **Network Layer and P2P Sync (Months 3-4): €10,000**
   - Building the libp2p node setup for mobile.
   - Writing and testing the Bloom filter incremental sync protocol.
   - *Effort: 200 hours @ €50/hr.*

3. **Local LLM Integration (Months 5-6): €10,000**
   - Integrating `llama.rn` into the React Native environment.
   - Developing the matching engine and optimizing prompts for 1B models.
   - *Effort: 200 hours @ €50/hr.*

4. **Mobile App UI and UX (Months 7-8): €10,000**
   - Building the React Native app interfaces.
   - Wiring up the local SQLite graph database to the UI.
   - *Effort: 200 hours @ €50/hr.*

5. **Pilot Testing and Documentation (Month 9): €5,000**
   - Running a pilot with a local community group.
   - Writing protocol documentation and user guides.
   - Prepping the codebase for any future security audits.
   - *Effort: 100 hours @ €50/hr.*

**Total: €45,000**

The funding will allow for the dedication of full technical expertise to solving the coordination problems observed in marginalized communities, delivering a fully open-source, public-good tool.
