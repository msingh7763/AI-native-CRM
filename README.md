# Xeno CRM Platform

An AI-native Customer Relationship Management and Marketing Automation platform. Built to manage customers, segment audiences using natural language, generate and launch campaigns with AI, and track real-time delivery analytics.
<h1>https://ai-native-crm-one.vercel.app/</h1>
---

## Live Demo

- **Frontend (Vercel):** `https://your-app.vercel.app`
- **Backend (Render):** `https://your-server.onrender.com`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Framer Motion |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas (Mongoose) |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Deployment | Vercel (client) + Render (server) |
| Real-time | Server-Sent Events (SSE) |

---

## Architecture

```
┌─────────────────┐        ┌──────────────────────┐        ┌──────────────┐
│   React Client  │──────▶ │   Express Server      │──────▶ │  MongoDB     │
│   (Vercel)      │◀────── │   (Render, Port 5000) │        │  Atlas       │
└─────────────────┘  REST  └──────────────────────┘        └──────────────┘
                      +SSE          │
                                    │ Google Gemini API
                                    ▼
                           ┌──────────────────────┐
                           │  Delivery Simulator   │
                           │  (In-process, async)  │
                           └──────────────────────┘
```

The server handles all business logic. The delivery simulator runs inside the server process — it simulates real-world message delivery with a random 2–5 second delay and fires webhook callbacks to update message statuses.

---

## Features

### 1. Dashboard
- Overview cards: Total Customers, Campaigns Sent, Avg Open Rate, Click-Through Rate
- Engagement Funnel bar chart (Sent → Delivered → Opened → Clicked) powered by Recharts
- **Live updates via SSE** — dashboard stats refresh automatically whenever a campaign delivery status changes
- **Generate Demo Data** button — seeds 500 customers and 2000 realistic orders in one click (clears existing data first)
- Analytics data is **cached for 10 seconds** server-side to reduce DB load

### 2. Customer Management
- Full CRUD — Add, Edit, Delete customers
- Fields: Name, Email, Phone, City, Total Spent (₹), Last Order Date
- **Search** by name or email in real-time
- **Filter** by All / High Spenders (>₹5000) / Recent (last 30 days)
- Animated row transitions using Framer Motion
- Toast notifications for all actions (success/error)

### 3. AI Audience Builder
- Type a plain-English description of your target audience
- **Google Gemini** converts it into a real MongoDB query automatically
- Displays the generated query and matching customer count
- One-click **"Create Campaign for this Segment"** — passes the segment directly to the Campaign Builder
- Example prompts:
  - `"Customers who spent more than ₹5000 and haven't ordered in 60 days"`
  - `"High value customers from Delhi"`
  - `"Customers likely to churn"`

### 4. AI Campaign Builder
- Describe a campaign goal in plain English
- **Google Gemini** generates:
  - Campaign name
  - Email/SMS subject line
  - Personalized message body (with `[Name]` placeholder)
  - Recommended channel (Email / WhatsApp / SMS / RCS)
  - Target audience description
- All fields are **fully editable** before launching
- Channel selector lets you override the AI recommendation
- On launch — Gemini also builds the MongoDB segment query if one wasn't passed from the Audience Builder
- Campaign is saved with status `Running` and messages are dispatched asynchronously

### 5. Campaign History & Live Stats
- All campaigns displayed as cards with status badges
- **Running campaigns poll every 2.5 seconds** for live stat updates
- Animated number counters — metrics count up smoothly as deliveries come in
- Real-time delivery progress bar (dispatched / total audience)
- Live pending message counter: `⏳ 42 pending · 35 delivered · 0 failed`
- **Auto-transitions to Completed** when all messages are resolved — pulsing orange dot turns into a green "Completed" badge
- Stats shown on every card:
  - **Delivered %** — messages successfully delivered
  - **Opened %** — messages opened/read
  - **Clicked %** — links clicked
  - **Orders %** — conversions (purchases)
- **Delete campaign** — trash icon with inline confirm (`Delete? Yes / No`), auto-resets after 3 seconds, removes card instantly, also cleans up all communication logs

### 6. Settings
- **Dark / Light mode** toggle (persists via React context)
- Notification preferences (Campaign Delivery Alerts, Weekly Reports)
- **Clear Analytics Cache** button — forces fresh DB query on next dashboard load

---

## Message Delivery Simulation

When a campaign is launched, each customer gets a `CommunicationLog` entry with status `Pending`. The simulator then fires after a random 2–5 second delay per message, updates the log to a final status, and marks the campaign `Completed` when all logs are resolved.

**Status probability distribution:**

| Status | Probability | Meaning |
|---|---|---|
| Failed | 10% | Message could not be delivered |
| Delivered | 20% | Delivered but not opened |
| Opened | 35% | Message was opened |
| Read | 20% | Message was read/seen |
| Clicked | 10% | Link inside message was clicked |
| Converted | 5% | Customer made a purchase |

---

## AI Integration (Google Gemini)

Two features use Gemini. Both have a **fallback mode** — if no API key is set, keyword-based heuristics run instead so the app works without a key.

**Audience Builder** → `generateMongoQueryFromPrompt()`
- Sends the user's natural language prompt to Gemini
- Returns a raw MongoDB query JSON object
- Handles operators: `$gt`, `$lt`, `$gte`, `$lte`, `$regex`, `$in`, etc.
- Falls back to regex-based keyword parsing if no key

**Campaign Builder** → `generateCampaignContent()`
- Sends the campaign goal to Gemini with a strict JSON response schema
- Returns structured campaign object (name, subject, message, channel, audience)
- Falls back to hardcoded templates for common campaign types

---

## API Endpoints

### Customers
| Method | Route | Description |
|---|---|---|
| GET | `/api/customers` | List all customers |
| POST | `/api/customers` | Add a new customer |
| PUT | `/api/customers/:id` | Update a customer |
| DELETE | `/api/customers/:id` | Delete a customer |

### Campaigns
| Method | Route | Description |
|---|---|---|
| GET | `/api/campaigns` | List all campaigns with stats |
| GET | `/api/campaigns/:id/stats` | Live stats for one campaign |
| POST | `/api/campaigns/generate` | AI-generate campaign content |
| POST | `/api/campaigns/launch` | Save and launch a campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign + its logs |

### Segments
| Method | Route | Description |
|---|---|---|
| POST | `/api/segments/build` | AI-generate MongoDB query from prompt |

### Analytics
| Method | Route | Description |
|---|---|---|
| GET | `/api/analytics` | Dashboard metrics (cached 10s) |
| DELETE | `/api/analytics/cache` | Clear analytics cache |

### Webhook & SSE
| Method | Route | Description |
|---|---|---|
| POST | `/api/webhook/receipt` | Update message delivery status |
| GET | `/api/webhook/stream` | SSE stream for live dashboard updates |

### Demo
| Method | Route | Description |
|---|---|---|
| POST | `/api/demo/generate` | Seed 500 customers + 2000 orders |

---

## Project Structure

```
xeno/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx         # Analytics overview + demo data
│       │   ├── Customers.jsx         # Customer CRUD table
│       │   ├── AudienceBuilder.jsx   # AI segment builder
│       │   ├── CampaignBuilder.jsx   # AI campaign generator + launcher
│       │   ├── CampaignHistory.jsx   # Live campaign tracking cards
│       │   └── Settings.jsx          # Theme + cache controls
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   └── Header.jsx
│       └── services/
│           └── api.js                # Axios API calls
│
├── server/                    # Express backend
│   └── src/
│       ├── controllers/
│       │   ├── analyticsController.js
│       │   ├── campaignController.js  # Launch + simulate delivery
│       │   ├── customerController.js
│       │   ├── segmentController.js
│       │   ├── webhookController.js   # SSE + receipt handler
│       │   └── demoController.js      # Seed data
│       ├── models/
│       │   ├── Campaign.js
│       │   ├── CommunicationLog.js
│       │   ├── Customer.js
│       │   └── Order.js
│       ├── services/
│       │   ├── aiService.js           # Gemini integration
│       │   ├── inMemoryCache.js       # Analytics cache
│       │   └── inMemoryQueue.js       # Sequential task queue
│       └── utils/
│           └── querySanitizer.js      # MongoDB query safety
│
└── channel-service/           # Optional standalone delivery simulator
    └── index.js
```

---

## Running Locally

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas URI)

### 1. Server
```bash
cd server
npm install
# create .env with MONGO_URI and GEMINI_API_KEY
npx nodemon src/index.js
# runs on http://localhost:5000
```

### 2. Client
```bash
cd client
npm install
# set VITE_API_URL=http://localhost:5000/api in .env
npm run dev
# runs on http://localhost:5173
```

### 3. Channel Service (optional — server has built-in simulator)
```bash
cd channel-service
npm install
# set CRM_WEBHOOK_URL=http://localhost:5000/api/webhook/receipt in .env
node index.js
# runs on http://localhost:5001
```

---

## Environment Variables

### Server (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://...
GEMINI_API_KEY=your_google_ai_studio_key
CHANNEL_SERVICE_URL=         # leave blank to use built-in simulator
WEBHOOK_SECRET=              # optional shared secret for webhook auth
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Deployment Notes

### Render (Server)
Set these environment variables in Render dashboard:
- `MONGO_URI` — MongoDB Atlas connection string
- `GEMINI_API_KEY` — from [aistudio.google.com](https://aistudio.google.com)
- `PORT` — Render sets this automatically

### Vercel (Client)
Set in Vercel project settings:
- `VITE_API_URL` — your Render server URL e.g. `https://your-app.onrender.com/api`

> **Important:** Do NOT set `CHANNEL_SERVICE_URL` on Render unless you have a separately deployed channel service. Leave it blank and the server will use the built-in delivery simulator. Setting it to `localhost` will break delivery stats.

---

## Key Design Decisions

**In-process delivery simulation** — The channel service runs inside the server when `CHANNEL_SERVICE_URL` is not set. This avoids cross-container `localhost` failures in production while keeping the same probability-based delivery logic.

**SSE over WebSockets** — Server-Sent Events are used for live dashboard updates. SSE is one-directional (server → client) which is all that's needed here, and it works without any additional libraries.

**Sequential message queue** — Messages are dispatched one at a time via an in-memory queue rather than in parallel. This avoids flooding the database with concurrent writes when launching large campaigns.

**Gemini without strict schema for queries** — The MongoDB query generator doesn't use a response schema because query keys (`$gt`, field names) are dynamic. Gemini is asked to return raw JSON instead, with unwrapping logic to handle both `{"totalSpent": ...}` and `{"query": {"totalSpent": ...}}` response shapes.

**Polling vs SSE for campaign cards** — Individual campaign cards poll `/campaigns/:id/stats` every 2.5 seconds only while `Running`. This is simpler and more reliable than extending SSE for per-campaign subscriptions, and stops automatically once the campaign completes.
