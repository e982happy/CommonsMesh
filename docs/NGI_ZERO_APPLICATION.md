# NGI Zero Commons Fund Application

**Target Call:** NGI Zero Commons Fund (Deadline: April 1st 2026)  
**Project Name:** CommonsMesh  
**Requested Amount:** €45,000  

---

## 1. Abstract

**Can you explain the whole project and its expected outcome(s)?** *(Max 1200 characters)*

I'm building CommonsMesh, a local-first mobile app designed for grassroots mutual aid and community organizing. It operates entirely without central servers.

Right now, community groups rely on WhatsApp or Facebook. Needs get lost in chat history, and privacy is non-existent. CommonsMesh changes this by running a peer-to-peer network (libp2p) directly between phones. When someone needs a tool, offers a skill, or proposes a community project, the app broadcasts it as a cryptographically signed event. 

Instead of a noisy chat feed, the app builds a local "community graph" database on each device. I'm embedding a small, efficient LLM (like Qwen2.5 1B) directly into the app to run locally. This AI constantly reads the local graph to spot matching needs, suggest group purchases, or help divide tasks for community projects—without any data ever leaving the user's phone.

The outcome will be a production-ready mobile app and a reusable P2P protocol stack. It gives marginalized and resource-constrained communities a secure, private, and highly efficient way to coordinate real-world action, turning their collective needs into structured, actionable steps.

---

## 2. Previous Relevant Experience

**Have you been involved with projects or organisations relevant to this project before?** *(Max 2500 characters)*

My background is a mix of software engineering and architectural field research, which gives me a unique perspective on community infrastructure. 

For the past five years, I've worked as a software developer at a smart glasses company. This role forced me to become highly proficient in writing efficient, resource-constrained code that runs on edge devices. I know how to optimize software for hardware with limited battery and processing power, which is exactly the skill set needed to run local LLMs and P2P sync protocols on mobile phones.

Before moving into tech, my undergraduate and graduate studies were in architecture. During that time, I spent months doing intensive field research in marginalized communities, both domestically and internationally. The most formative experience was my work in Port Moresby, Papua New Guinea, where I helped design affordable housing and engaged directly with informal settlement communities. 

Spending time in these settlements taught me how people actually survive on the margins: through dense, informal networks of mutual aid and shared resources. They don't need another social network; they need tools that respect their limited resources (like intermittent internet access) and help them coordinate the sharing of physical goods, labor, and collective bargaining power. 

I don't have a long history in cryptographic protocol design, but my edge computing experience combined with my deep, firsthand understanding of what underserved communities actually need to self-organize is why I'm building CommonsMesh. I'm applying my technical skills to solve the coordination bottlenecks I saw firsthand in Port Moresby and other communities.

---

## 3. Compare with Existing Efforts

**Compare your own project with existing or historical efforts. E.g. what is new, more thorough or otherwise different.** *(Max 4000 characters)*

If you look at how communities organize today, they almost exclusively use centralized platforms like WhatsApp, Discord, or Facebook Groups. These are great for talking, but terrible for coordinating. A request for help gets buried under fifty other messages. The burden of matching people who have resources with people who need them falls entirely on exhausted community organizers. Plus, these communities are surrendering all their social graph data to tech giants.

There are decentralized alternatives like Mastodon or Secure Scuttlebutt. But they just replicate the "social feed" model in a federated way. They are still optimized for broadcasting thoughts, not organizing labor or sharing resources.

CommonsMesh takes a completely different approach. 

First, we don't treat communication as text messages. We treat it as state changes. When a user interacts with the app, they are publishing structured intents—like `graph.delta` (I need a ladder) or `project.motion` (Let's clean up the park). This builds a queryable database of community capacity, not a timeline of chatter.

Second, the app does the heavy lifting of coordination. By running a lightweight LLM locally on the phone, the app can look at the community graph and say, "Hey, three of your neighbors need the same building materials, you should bulk order," or "You need moving boxes and your neighbor just finished moving." It acts as an automated, privacy-respecting community organizer.

Finally, it works in the reality of marginalized communities. It doesn't assume you have a fast, always-on internet connection or a server you can rent. It syncs directly phone-to-phone over libp2p when connections are available. It's built for resilience in places where infrastructure is unreliable.

---

## 4. Significant Technical Challenges

**What are significant technical challenges you expect to solve during the project?** *(Max 5000 characters)*

Building this requires solving a few hard problems, mostly around making edge computing and P2P networks play nicely together on mobile devices.

1. **Running LLMs on Mobile Devices:** 
   Getting a 1B parameter model to run on a mid-range Android phone without draining the battery or freezing the UI is tough. I'm integrating `llama.cpp` via React Native (`llama.rn`). The challenge isn't just getting it to run; it's writing the right prompts so a small model can accurately extract matching patterns from JSON graph data. I'll need to heavily optimize the inference pipeline so it only runs when the phone is idle or plugged in.

2. **Efficient State Sync over P2P:** 
   Phones go offline constantly. When two nodes finally connect, they need to figure out what events they are missing without transferring the whole database. I'm building a sync protocol over libp2p using Bloom filters. The technical hurdle is tuning the filter size so we minimize bandwidth (targeting under 50 KB/day per user) while still guaranteeing that the cryptographically linked event log eventually reaches consistency across the neighborhood.

3. **Preventing Abuse Without Central Servers:** 
   Because there's no central server to ban bad actors, preventing Sybil attacks (someone spinning up a thousand fake accounts to spam the network) is a major issue. I'm approaching this pragmatically. Instead of heavy blockchain consensus, I'm using a mix of device-level hardware attestation (proving it's a real phone) and a local web-of-trust scoring system. If an account starts spamming, their local trust score drops, and other nodes simply drop their packets. Getting this logic right so it protects the network without locking out legitimate new users is a delicate balancing act.

4. **Handling Concurrent Edits in a Graph:** 
   If two people accept the same community task while offline, the network has to resolve that conflict gracefully when they reconnect. I'm implementing a CRDT (Conflict-Free Replicated Data Type) approach adapted for our signed event envelopes, ensuring the UI reflects the reality of the community state without breaking the cryptographic chain of events.

---

## 5. Ecosystem and Engagement

**Describe the ecosystem of the project, and how you will engage with relevant actors and promote the outcomes?** *(Max 2500 characters)*

The ecosystem around CommonsMesh involves grassroots organizers, the local-first software community, and open-source AI developers.

To make sure this actually works for people on the ground, I'm not developing it in a vacuum. I plan to partner with local mutual aid networks and housing cooperatives to run pilot deployments. My background in community research taught me that if you don't test with the actual end-users early on, you build the wrong thing. Their feedback will directly shape the UI and the AI matching logic.

Technically, I'm leaning heavily on the libp2p ecosystem. I intend to contribute my findings back to that community, particularly around mobile P2P networking and efficient Bloom filter syncing, which are known pain points in the space. 

I'll also engage with the open-source AI community (like the Hugging Face and llama.cpp ecosystems). Proving that you can use local, small-parameter models for concrete social good—rather than just chatbots—is a compelling use case that I think will attract contributors.

Everything I build will be open-sourced under AGPL-3.0. I'll document the protocol specifications clearly so other developers can build compatible clients or relay nodes, helping to grow this into a true piece of digital commons infrastructure.

---

## 6. Budget Explanation and Funding Sources

**Explain what the requested budget will be used for. A breakdown in the main tasks with associated effort is appreciated. Make rates explicit.** *(Max 2500 characters)*

I am requesting €45,000 to fund the research, development, and pilot deployment of CommonsMesh over a 9-month period. I am working on this independently and currently have no other funding sources.

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

The funding will allow me to dedicate my full technical expertise to solving the coordination problems I've seen in marginalized communities, delivering a fully open-source, public-good tool.
