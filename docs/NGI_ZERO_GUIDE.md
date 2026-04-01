# NGI Zero Commons Fund — Application Submission Guide

This document explains **which call to apply to**, **how to fill in the online form**, and **what to attach**. Read this before going to [https://nlnet.nl/propose/](https://nlnet.nl/propose/).

---

## Step 1: Choose the Right Call

**Apply to: NGI Zero Commons Fund**

This is the correct and only currently open call for CommonsMesh. Here is why it is the best fit:

| Criterion | CommonsMesh Alignment |
|---|---|
| **Free and open source software** | AGPL-3.0 license; all code public on GitHub |
| **P2P infrastructure to end-user applications** | Full-stack: libp2p network → local DB → mobile app |
| **Digital commons** | No central server; community-owned data |
| **Privacy-preserving** | On-device LLM; no data leaves the device |
| **Collective action / democratic engagement** | Community motions, voting, dispute resolution |
| **Decentralization** | Fully serverless; no single point of failure |

The NGI Zero Commons Fund explicitly seeks projects spanning "from P2P infrastructure to convenient end user applications" with a "holistic, full-stack approach." CommonsMesh is precisely this: a complete stack from the cryptographic protocol layer to the mobile UI.

**Do NOT apply to NGI TALER** (focused on payment systems) or **NGI Fediversity** (focused on ActivityPub federation). The Commons Fund is the correct home for this project.

---

## Step 2: Fill in the Online Form

Go to: [https://nlnet.nl/propose/](https://nlnet.nl/propose/)

Fill in each field as follows:

### Contact Information

| Field | What to Enter |
|---|---|
| **Call** | NGI Zero Commons Fund |
| **Your name** | Your full legal name |
| **Email** | Your primary contact email |
| **Phone** | Your phone number with country code |
| **Organisation** | Leave blank if applying as an individual; or your org name |
| **Country** | Your country of residence |

### General Project Information

| Field | What to Enter |
|---|---|
| **Proposal name** | `CommonsMesh` |
| **Website / wiki** | `https://github.com/e982happy/CommonsMesh` |

### Abstract (1200 characters max)

Copy the text from **Section 1** of `NGI_ZERO_APPLICATION.md`. This is the most important field — reviewers read this first. Make sure it is clear, concrete, and mentions: decentralized, libp2p, on-device LLM, community mutual aid, privacy-preserving, AGPL.

### Previous Relevant Experience (2500 characters max)

Copy from **Section 2** of `NGI_ZERO_APPLICATION.md` and **personalize it with your actual background**. This is critical — reviewers need to believe you can deliver the project. Include:
- Any open-source contributions
- Experience with P2P systems, cryptography, or mobile development
- Personal connection to community organizing or mutual aid

### Requested Amount

Enter: `45000`

*(This is within the first-proposal maximum of €50,000. It is deliberately set below the maximum to signal frugality and increase the chance of approval.)*

### Budget Explanation (2500 characters max)

Copy from **Section 6** of `NGI_ZERO_APPLICATION.md`. The key points reviewers look for are: explicit hourly rates, a clear breakdown by task, and confirmation that there are no other funding sources.

### Compare with Existing Efforts (4000 characters max)

Copy from **Section 3** of `NGI_ZERO_APPLICATION.md`. Emphasize the three key differentiators: structured state changes vs. chat, on-device AI, and Sybil resistance.

### Technical Challenges (5000 characters max)

Copy from **Section 4** of `NGI_ZERO_APPLICATION.md`. Be specific and technical — this is where you demonstrate depth of expertise.

### Ecosystem and Engagement (2500 characters max)

Copy from **Section 5** of `NGI_ZERO_APPLICATION.md`.

### Attachments

Upload the following files (accepted formats: HTML, PDF, OpenDocument, plain text):

1. **`NGI_ZERO_ATTACHMENT.md`** (or its PDF export) — The full technical proposal with milestone plan, architecture details, and sustainability strategy. This is the most important attachment.

To convert to PDF before uploading, run:
```bash
# From the CommonsMesh root directory
manus-md-to-pdf docs/NGI_ZERO_ATTACHMENT.md docs/NGI_ZERO_ATTACHMENT.pdf
```

### Generative AI Disclosure

Select: **"I have used generative AI in writing this proposal"**

This is the honest answer. NLnet's policy is transparent about this — they do not penalize AI-assisted proposals, but they do require disclosure.

---

## Step 3: Key Tips for a Strong Application

**On framing:** NGI Zero reviewers care deeply about the *commons* model. Frame CommonsMesh not just as an app, but as a contribution to the digital commons infrastructure. The protocol layer is a reusable public good; the app is the demonstration of its value.

**On the European Dimension:** The eligibility criteria give priority to EU/Horizon Europe-associated countries. If you are not based in Europe, you must clearly articulate the European Dimension. CommonsMesh has a natural European Dimension because: (1) it is built on libp2p, which was developed by Protocol Labs with significant European contributions; (2) it directly serves the NGI vision articulated by the European Commission; (3) the communities most likely to benefit from mutual aid coordination tools include European communities facing economic precarity. Mention this explicitly in your abstract or ecosystem section.

**On the scoring rubric:** The three criteria are weighted as follows:
- Technical excellence/feasibility: 30%
- Relevance/Impact/Strategic potential: 40%
- Cost effectiveness/Value for money: 30%

The highest-weighted criterion is impact. Spend the most effort making the case for *why this matters* — not just technically, but for society. The mutual aid framing is powerful: this is technology that directly helps people who are struggling.

**On the timeline:** The deadline for the current (12th) call is **April 1st 2026 at 12:00 CEST (noon)**. Submit at least 24 hours early to avoid technical issues.

**On follow-up questions:** If your proposal passes the first stage, reviewers will ask clarifying questions. Prepare answers for:
- How does this compare to Secure Scuttlebutt / Nostr / Briar?
- How will you handle the cold-start problem (a new community with no nodes)?
- What is your plan if the on-device LLM is not accurate enough for matching?
- How will you ensure the project is self-sustaining after the grant period?

---

## Step 4: After Submission

NLnet will contact you within a few days after the deadline. The full selection process takes approximately 2–3 months. If selected for the second stage, you will receive clarifying questions and may be asked to revise the budget or milestone plan.

If your proposal is not selected in this round, you are encouraged to apply again in the next call. NLnet explicitly states that teams which have successfully completed a smaller project can apply for larger grants in subsequent rounds.

---

## Checklist Before Submitting

- [ ] Abstract is under 1200 characters and clearly explains the project
- [ ] Personal experience section is personalized with your actual background
- [ ] Budget breakdown includes explicit hourly rates
- [ ] Requested amount is €45,000 (or adjusted based on your actual cost estimate)
- [ ] `NGI_ZERO_ATTACHMENT.md` is exported to PDF and ready to upload
- [ ] You have selected "NGI Zero Commons Fund" in the call dropdown
- [ ] You have disclosed AI assistance in the generative AI field
- [ ] You have read and accepted the privacy statement
