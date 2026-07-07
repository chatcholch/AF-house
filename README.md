# Affiliate Command Center

A one-person marketing control room for **Shopee Affiliate + TikTok Shop Affiliate** (with **Facebook Reels** tracking) content operations.

Find trending, rising, or newly launched products early → score the opportunity → generate human-like video concepts, scripts, captions, and **Gemini/Veo-ready video prompts** with a consistent fictional AI persona → schedule to a campaign board → track results, sales, and clicks → learn what converts.

## Principles baked into the product

- **Official data only** — official APIs, approved exports, CSV import, or manual entry. No scraping.
- **No auto-publishing** — everything is a draft that requires human approval.
- **Affiliate disclosure always included** in every generated caption (Thai + English variants).
- **Fictional AI personas only** — never a real person's name, face, likeness, or a celebrity reference.
- **Conservative claims** — a built-in claim-safety checker flags medical/beauty/exaggerated claims, fake scarcity, misleading "personal experience" framing for AI content, and aggressive CTAs. Skincare/supplement/health/beauty products automatically get stricter wording.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma 6 · SQLite (dev) / PostgreSQL-ready schema · provider-abstracted AI layer (built-in mock, OpenAI, Gemini).

## Quick start

```bash
npm install
npx prisma db push      # creates prisma/dev.db from the schema
npm run db:seed         # loads realistic mock data (15 products, personas, campaigns, results)
npm run dev             # http://localhost:3000
```

That's it — the app is fully usable with zero API keys thanks to the built-in mock AI provider and seeded mock market data.

### Useful scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:push` | Sync Prisma schema to the database |
| `npm run db:seed` | Reset + reseed all mock data |
| `npm run db:studio` | Browse the database in Prisma Studio |

## App modules

| Route | Module | What it's for |
| --- | --- | --- |
| `/` | **Dashboard** | Today's best opportunities, rising products, new drops, drafts awaiting approval, calendar, generation queue |
| `/radar` | **Product Radar** | Filterable product table: platform, category, scores, commission, signals, status (Watchlist → Test → Active → Winner / Rejected) |
| `/radar/[id]` | **Product Detail** | Why it might sell, buyer personas, pain points, score breakdown, affiliate data, generated content, campaign history |
| `/prompt-lab` | **Prompt Lab** | The AI content generator: 10 hooks, 5 concepts, 3 scripts (15–45 s) with storyboards, 3 captions + hashtags + disclosure, showcase & persona Veo prompts, negative prompt |
| `/personas` | **Persona Studio** | Reusable fictional AI presenters with consistency prompts, do/don't lists, brand-safe rules |
| `/campaigns` | **Campaign Board** | Kanban + calendar + list for scheduling: Idea → Generated → Needs Review → Approved → Posted → Testing → Winner/Failed/Archived |
| `/monitor` | **Monitor** | Results/sales/clicks tracker per posted video — views, engagement, clicks, orders, GMV, commission, CVR — across TikTok, Shopee Video, and Facebook |
| `/compliance` | **Compliance Check** | Paste any script/caption → Safe / Needs review / Risky / Reject verdict with per-line suggestions |
| `/analytics` | **Winner Tracker** | Best hooks, categories, video styles, personas, platforms; double-down and stop-testing lists |
| `/settings` | **Integrations** | API credential placeholders, AI provider switch, scoring-weight editor, CSV import |

## Where to configure things

### Add API keys later

- **Environment variables** (`.env`): `OPENAI_API_KEY`, `GEMINI_API_KEY`, `AI_PROVIDER` (`mock` \| `openai` \| `gemini`), plus placeholders for Shopee/TikTok/Facebook credentials. Env keys take priority.
- **Settings page** (`/settings`): store keys in the local DB and switch the active AI provider without restarting.
- The real Shopee/TikTok/Facebook API clients are intentionally **not implemented in v1** — the integration abstraction and mock provider are in place, so adding a client later means implementing one fetch layer without touching the UI.

### Modify scoring weights

- **Runtime:** `/settings` → "Opportunity scoring weights" (sliders, must sum to 100%), then "Save & rescore all products".
- **Code defaults:** [`src/lib/scoring.ts`](src/lib/scoring.ts) → `DEFAULT_WEIGHTS` (trend momentum 25%, brand strength 15%, commission 15%, virality 20%, competition gap 15%, compliance safety 10%) and the per-component formulas below it.

### Edit prompt templates

- **Content templates** (New brand drop, "Found it before viral", Problem–solution, 3 reasons, Showcase, Soft review, Unboxing, Price/value, Routine, Seasonal, Known-brand launch): [`src/lib/templates.ts`](src/lib/templates.ts).
- **Veo/Gemini prompt structure & negative prompt:** [`src/lib/ai/veo-prompt.ts`](src/lib/ai/veo-prompt.ts).
- **Mock generator phrase banks** (category-specific benefits/pain points, Thai + English): [`src/lib/ai/mock.ts`](src/lib/ai/mock.ts).
- **LLM system prompt + JSON contracts** used by OpenAI/Gemini: [`src/lib/ai/llm-shared.ts`](src/lib/ai/llm-shared.ts) and [`src/lib/ai/llm-provider.ts`](src/lib/ai/llm-provider.ts).

### Edit the default AI persona

- **Runtime:** `/personas` → edit **Nara** (default) or create your own and "Set default".
- **Seed definition:** [`prisma/seed.ts`](prisma/seed.ts) → the `nara` persona block.

### Compliance rules

[`src/lib/compliance.ts`](src/lib/compliance.ts) — regex rule table (English + Thai), disclosure patterns, severity scoring, and the standard disclosure lines appended to captions.

## Moving to PostgreSQL

1. In `prisma/schema.prisma`, change the datasource `provider` to `"postgresql"`.
2. Point `DATABASE_URL` at your Postgres instance.
3. `npx prisma db push` (or set up migrations with `prisma migrate dev`).
   Enum-like fields are plain `String` columns with TS const unions (`src/lib/types.ts`), so the schema is portable as-is.

## Data model

Prisma models: `Product`, `PlatformProductData`, `AffiliateLink`, `TrendSignal`, `OpportunityScore`, `Persona`, `ContentIdea`, `Script`, `Caption`, `VideoPrompt`, `Campaign`, `CampaignResult`, `ComplianceCheck`, `IntegrationCredential`, `AppSetting` — see [`prisma/schema.prisma`](prisma/schema.prisma).

## AI service layer

```
src/lib/ai/
├── provider.ts      # AiProvider interface + generation types
├── mock.ts          # Built-in deterministic provider (works offline)
├── llm-provider.ts  # Shared base for real LLMs (falls back to mock on any error)
├── openai.ts        # OpenAI Chat Completions
├── gemini.ts        # Google Gemini generateContent
├── veo-prompt.ts    # Structured Veo prompt compiler + negative prompt
├── llm-shared.ts    # System prompt, JSON parsing
└── index.ts         # getAiProvider() factory (env / settings driven)
```

Service methods: `generateProductAngles`, `generateHooks`, `generateConcepts`, `generateScript`, `generateCaption`, `generateVideoPrompt`, `generateContentPackage` — plus `runComplianceRules` in `src/lib/compliance.ts`.
