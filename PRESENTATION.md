# Xeno CRM — Walkthrough Presentation
### 5–6 Minute Video Script & Structure

---

## SECTION 1 — Product Intro `[0:00 – 0:30]`

> **What to say:**

"Hi, I'm [Your Name], and this is Xeno CRM — an AI-native Customer Relationship Management and Marketing Automation platform.

The problem I set out to solve: most small businesses have customer data but no easy way to act on it. They can't segment audiences without writing code, and writing campaign content is slow and manual.

Xeno fixes both of those things with AI. You describe your audience in plain English — AI builds the MongoDB query. You describe your campaign goal — AI writes the content. Then you launch, and the platform tracks every delivery in real time."

---

## SECTION 2 — Functional Demo `[0:30 – 2:00]`

> **Screen: Dashboard**

"Starting on the Dashboard. You can see Total Customers, Campaigns Sent, Open Rate, and Click-Through Rate. This chart is the Engagement Funnel — Sent → Delivered → Opened → Clicked.

I'll hit **Generate Demo Data** — this seeds 500 realistic customers and 2000 orders in one click so we have something to work with."

---

> **Screen: Customers page**

"The Customers page is a full CRUD table. Search, filter by high spenders or recent buyers, add, edit, delete. Every action shows an animated toast notification."

---

> **Screen: Audience Builder**

"Now the interesting part. I'll type: *'Customers who spent more than 5000 and haven't ordered in 60 days'*

AI translates that into a real MongoDB query — you can see the exact query object. It found [X] customers. I'll click **Create Campaign for this Segment** which carries this query directly into the Campaign Builder."

---

> **Screen: Campaign Builder**

"The Campaign Builder got the segment automatically. I'll describe the goal: *'Win back inactive customers with a 20% discount'*

Gemini generates — the campaign name, subject line, a personalized message with a `[Name]` placeholder, the recommended channel, and the target audience description. All editable.

I'll change the channel to Email, review the message, and hit **Launch Campaign**."

---

> **Screen: Campaign History**

"The campaign appears immediately with a pulsing orange **Running** badge. Watch the stats — Delivered, Opened, Clicked, Orders — they're all at 0 right now but will start climbing as the delivery simulator fires.

Every 2.5 seconds the card polls for fresh data. You can see the numbers animate upward in real time. The progress bar fills up as messages are dispatched.

When the last message is resolved — the badge flips to green **Completed** and polling stops."

---

## SECTION 3 — Technical Architecture `[2:00 – 3:00]`

> **Show diagram (draw or use the one below)**

```
┌─────────────────┐        ┌──────────────────────┐        ┌──────────────┐
│   React Client  │──────▶ │   Express Server      │──────▶ │  MongoDB     │
│   (Vercel)      │◀────── │   (Render)            │        │  Atlas       │
└─────────────────┘  REST  └──────────────────────┘        └──────────────┘
      ▲  SSE                        │
      │  live updates               │ Google Gemini API
      └─────────────────────────────┘
                              │
                    ┌─────────────────────┐
                    │  In-Process         │
                    │  Delivery Simulator │
                    │  (async, setTimeout)│
                    └─────────────────────┘
```

> **What to say:**

"The architecture is three layers.

**Frontend** — React + Vite on Vercel. It talks to the backend over REST and receives live delivery updates over SSE — Server-Sent Events. No WebSockets needed since data only flows one direction, server to client.

**Backend** — Express on Render. All business logic lives here. Gemini API calls, MongoDB queries, the message queue, the delivery simulator.

**Database** — MongoDB Atlas. Three key collections: Customers, Campaigns, and CommunicationLogs — one log per customer per campaign, tracking status from Pending all the way to Converted.

One key production decision: the delivery simulator runs **inside the server process** instead of as a separate service. Why? Because on Render, cross-service `localhost` calls silently fail. By moving it in-process, there's no network hop and no configuration needed in production."

---

## SECTION 4 — Code Walkthrough `[3:00 – 4:00]`

> **Show: `server/src/controllers/campaignController.js`**

"Let me walk through the two most important pieces.

**Launch flow** — when a campaign is launched, we find the target customers, save the campaign as `Running`, then for each customer we add a task to an in-memory queue. The queue processes tasks one at a time to avoid hammering MongoDB. Each task creates a `CommunicationLog` with status `Pending`, then calls `simulateDelivery`.

**simulateDelivery** — sets a random 2 to 5 second timer. When it fires, it picks a status based on real-world probability — 10% Failed, 20% Delivered, 35% Opened, 20% Read, 10% Clicked, 5% Converted. Updates the log, clears the analytics cache, and if no Pending logs remain, marks the campaign Completed."

---

> **Show: `server/src/services/aiService.js`**

"The AI service has two functions.

`generateMongoQueryFromPrompt` — takes plain English, sends it to Gemini 2.5 Flash, gets back a raw JSON MongoDB query. No rigid schema here because query keys are dynamic — `$gt`, `$lt`, field names. The prompt includes the customer schema and today's date so date calculations like 'inactive 60 days' are accurate.

`generateCampaignContent` — uses a strict JSON response schema so Gemini always returns the exact five fields we need: name, subject, message, channel, audience description."

---

> **Show: `client/src/pages/CampaignHistory.jsx`**

"On the frontend, each campaign card manages its own polling. Running cards call `/campaigns/:id/stats` every 2.5 seconds. The `AnimatedNumber` component uses `requestAnimationFrame` to smoothly count up from the previous value to the new one. When the API returns `status: Completed`, the interval clears itself and the badge transitions."

---

## SECTION 5 — AI-Native Workflow `[4:00 – 5:00]`

> **What to say:**

"AI wasn't just a feature I added — it shaped how I built.

**During development**, I used Kiro AI as my development environment. It read my code before writing new code, matched my existing patterns instead of introducing new ones, and handled the repetitive parts — controller boilerplate, route wiring, CSS classes — so I could focus on the architecture and decisions.

**In the product**, Gemini does two distinct things:

First, it acts as a **query translator** — bridging the gap between natural language and MongoDB syntax. This is genuinely hard to do with regex and keyword matching for anything beyond basic cases. Gemini handles city names, relative dates, spending ranges, and combinations of all three.

Second, it acts as a **content strategist** — given a campaign goal, it understands marketing context well enough to recommend the right channel, write a compelling subject line, and personalize the message.

The fallback system was a conscious design choice — every Gemini call has a keyword-based fallback so the app degrades gracefully when the API is unavailable or the key isn't set. That meant I could develop and demo the full flow without depending on API availability.

One real challenge: Gemini model deprecations. `gemini-1.5-flash` was removed, then `gemini-2.0-flash` was shut down in June 2026. I migrated to the new `@google/genai` SDK and `gemini-2.5-flash` — and learned that thinking models like 2.5 Flash don't respect generic `Type.OBJECT` schemas for dynamic keys, so I switched the query endpoint to free-form JSON parsing instead."

---

## SECTION 6 — Close `[5:00 – 5:30]`

> **What to say:**

"To summarize what Xeno CRM does end to end:

1. You generate or import your customer data
2. You describe your audience in plain English — AI builds the segment
3. You describe your campaign goal — AI writes the content
4. You launch — messages dispatch asynchronously through a queue
5. Stats update live on the campaign card, animating from 0 to final values
6. Campaign auto-completes when all deliveries are resolved

The full stack is React, Express, MongoDB, and Gemini — deployed on Vercel and Render.

Thank you."

---

## Quick Reference — Key Numbers to Mention

| Metric | Value |
|---|---|
| Demo data generated | 500 customers, 2000 orders |
| Delivery simulation delay | 2–5 seconds per message |
| Failed rate | 10% |
| Delivered rate | ~20% |
| Opened rate | ~35% |
| Read rate | ~20% |
| Clicked rate | ~10% |
| Converted (Orders) rate | ~5% |
| Campaign card poll interval | 2.5 seconds |
| Analytics cache TTL | 10 seconds |

---

## Things to Point Out During Demo

- The **pulsing orange dot** on Running campaigns
- Stats at **0.0% animating upward** live
- The **progress bar** filling as messages dispatch
- The `⏳ X pending` counter ticking down
- The instant **Running → Completed** badge transition
- The **Generated MongoDB Query** display in Audience Builder
- The **inline delete confirmation** (no modal) on campaign cards
- The **toast notifications** that appear bottom-right on every action
