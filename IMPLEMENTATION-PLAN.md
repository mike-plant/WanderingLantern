# AI Content Platform — Implementation Plan

> Phased build plan optimized for Claude Pro plan sessions.
> Default model: **Sonnet 4.6** (switch to Opus only where noted).

---

## Model Usage Guide

| Task Type | Model | Why |
|---|---|---|
| Scaffolding, CRUD, boilerplate | **Sonnet** | Fast, cheap, handles well-specified work |
| Complex integrations, debugging | **Sonnet** (try first) → **Opus** if stuck | Sonnet handles most with good specs |
| Architecture pivots, tricky bugs | **Opus** | Worth the cost for hard problems |
| Simple file edits, renaming | **Haiku** | Fastest for trivial changes |

**Rule of thumb:** Start every session on Sonnet. Only escalate if you hit a wall.

---

## Phase 1: Foundation (Sessions 1–3)

Everything else depends on this. Get it right, move on.

### Session 1 — Project Bootstrap
**Model: Sonnet**

- [ ] Initialize Turborepo monorepo (`content-platform/`)
- [ ] Set up `packages/shared` with TypeScript config
- [ ] Set up `apps/api` with Fastify + TypeScript
- [ ] Configure Drizzle ORM + postgres.js driver
- [ ] Create `.env.example` with all required vars
- [ ] Add `docker-compose.yml` for local Postgres + Redis
- [ ] Verify: `npm run dev` starts the API, connects to DB

**Deliverable:** Empty API server that boots, connects to Postgres, and returns `{ status: "ok" }` on `GET /health`.

### Session 2 — Database Schema + Shared Types
**Model: Sonnet**

- [ ] Define all Drizzle table schemas:
  - `users`, `refresh_tokens`
  - `brand_profiles`, `social_accounts`
  - `content_sessions`, `generated_items`, `content_versions`
  - `feedback`
  - `examples`
- [ ] Generate initial migration (`0000_init.sql`)
- [ ] Define shared TypeScript interfaces in `packages/shared`
- [ ] Define Zod validation schemas in `packages/shared/validation`
- [ ] Run migration, verify tables exist

**Deliverable:** Full database schema matching the spec, types and validation shared across packages.

### Session 3 — Auth System
**Model: Sonnet**

- [ ] User registration (argon2 hashing)
- [ ] Login → JWT access token (15 min) + refresh token (7 days)
- [ ] Refresh endpoint
- [ ] Logout (revoke refresh token)
- [ ] Auth middleware (JWT verification hook)
- [ ] Protected route decorator
- [ ] Basic tests with Vitest

**Deliverable:** Register → Login → Access protected route → Refresh → Logout flow works end-to-end.

---

## Phase 2: User Profile + Brand (Sessions 4–5)

### Session 4 — User Profile Service
**Model: Sonnet**

- [ ] `GET /users/me` — return profile
- [ ] `PATCH /users/me` — update profile fields
- [ ] `PUT /users/me/brand-guidelines` — store brand doc (text/structured)
- [ ] `PUT /users/me/tone-of-voice` — tone descriptors
- [ ] Platform preferences per connected account
- [ ] Tests

**Deliverable:** User can set up their full brand profile that will feed into AI prompts.

### Session 5 — Plugins + Infrastructure
**Model: Sonnet**

- [ ] Redis plugin (ioredis as Fastify plugin)
- [ ] BullMQ setup for job queues
- [ ] Rate limiting plugin (Redis-backed)
- [ ] CORS configuration
- [ ] Swagger/OpenAPI docs at `/docs`
- [ ] Global error handler with request IDs
- [ ] Pino logging configuration

**Deliverable:** Production-grade middleware layer. API docs auto-generated.

---

## Phase 3: AI Content Generation (Sessions 6–8)

This is the core product. Take your time here.

### Session 6 — Prompt Builder + Ideation
**Model: Sonnet (Opus if prompt quality needs tuning)**

- [ ] `prompt-builder.ts` — assembles user context (brand, tone, audience, examples, feedback history) into system prompt
- [ ] Prompt caching setup (`cache_control` on system prompts)
- [ ] `POST /content/ideate` — generate 5-10 topic ideas
- [ ] Structured output via Claude tool use (`strict: true`)
- [ ] Store ideas in `content_sessions`

**Deliverable:** Given a user's brand profile, generates relevant content ideas as structured JSON.

### Session 7 — Drafting + Platform Adaptation
**Model: Sonnet**

- [ ] `POST /content/draft` — take an idea, generate full content draft
- [ ] `POST /content/adapt` — take a draft, generate platform-specific versions (Twitter/LinkedIn/Instagram/Facebook)
- [ ] Platform character limits + format constraints enforced
- [ ] Content versioning (each edit creates a new version)
- [ ] Cascade logic: editing source draft re-adapts platform versions

**Deliverable:** Full ideate → draft → adapt pipeline works. Edit a draft, platform versions update.

### Session 8 — Image Generation
**Model: Sonnet**

- [ ] OpenAI DALL-E / GPT Image integration
- [ ] `POST /content/generate-images` — generate images for a content piece
- [ ] S3/R2 upload for generated images
- [ ] Image URL storage in content records
- [ ] Size/format presets per platform (1:1 for Instagram, 16:9 for Twitter, etc.)

**Deliverable:** Content drafts can have AI-generated images attached, stored in object storage.

---

## Phase 4: Social Platform OAuth (Sessions 9–12)

One platform per session. They're similar but each has quirks.

### Session 9 — Twitter/X OAuth + Posting
**Model: Sonnet**

- [ ] OAuth 2.0 PKCE flow (`twitter-api-v2` package)
- [ ] `GET /auth/social/twitter/connect` → redirect to X
- [ ] `GET /auth/social/twitter/callback` → store encrypted tokens
- [ ] Token refresh (2-hour expiry)
- [ ] `POST /publish` → post tweet (text + optional media)
- [ ] Media upload flow
- [ ] Encrypted token storage (AES-256-GCM)

**Deliverable:** Connect Twitter account, post a tweet with image from the API.

### Session 10 — LinkedIn OAuth + Posting
**Model: Sonnet**

- [ ] OAuth 2.0 flow (direct HTTP, no SDK)
- [ ] Connect/callback routes
- [ ] Two-step image upload (initializeUpload → PUT binary)
- [ ] `POST /rest/posts` via versioned API
- [ ] 60-day token management (no refresh without Community Management product)
- [ ] Personal profile vs company page support

**Deliverable:** Connect LinkedIn, post with image to personal profile or company page.

### Session 11 — Instagram + Facebook (Meta)
**Model: Sonnet**

- [ ] Meta OAuth 2.0 (shared flow for both platforms)
- [ ] Short-lived → long-lived token exchange
- [ ] Instagram: two-step publish (create container → publish)
- [ ] Instagram: carousel support
- [ ] Facebook: page posting via page access token
- [ ] Token refresh before 60-day expiry

**Deliverable:** Connect Meta account, post to Instagram (single + carousel) and Facebook page.

### Session 12 — Publishing Service + Scheduler
**Model: Sonnet**

- [ ] Unified publishing service with adapter pattern
- [ ] `adapter.interface.ts` — common interface
- [ ] `POST /publish` — immediate publish to selected platforms
- [ ] `POST /schedule` — queue for future publishing (BullMQ delayed jobs)
- [ ] `GET /publish/history` — publishing log with status
- [ ] Error handling: per-platform failure isolation
- [ ] Retry logic for transient failures

**Deliverable:** Publish to any connected platform. Schedule posts for the future. See publishing history.

---

## Phase 5: Feedback Loop (Sessions 13–14)

### Session 13 — Feedback System
**Model: Sonnet**

- [ ] `POST /feedback` — record user feedback on generated content
- [ ] Feedback types: accept, reject, edit, favorite
- [ ] Optional text notes on feedback
- [ ] `GET /feedback/summary` — aggregated stats
- [ ] `GET /feedback/history` — paginated history

**Deliverable:** Users can rate/annotate generated content. Data stored for AI improvement.

### Session 14 — Examples + Learning Loop
**Model: Sonnet**

- [ ] `POST /examples` — save high-performing content as examples
- [ ] `GET /examples` — retrieve user's example library
- [ ] `DELETE /examples/:id` — remove examples
- [ ] Integrate examples into prompt builder (few-shot learning)
- [ ] Integrate feedback summary into prompt builder
- [ ] Performance metrics on examples (engagement data if available)

**Deliverable:** The AI gets better over time by learning from the user's favorites and feedback.

---

## Phase 6: Frontend (Sessions 15–20)

### Session 15 — Frontend Bootstrap + Auth UI
**Model: Sonnet**

- [ ] Next.js or Vite+React app in `apps/web`
- [ ] Tailwind CSS setup
- [ ] Auth pages: register, login, forgot password
- [ ] JWT token management (httpOnly cookies or secure storage)
- [ ] Protected route wrapper
- [ ] Basic layout: sidebar nav, main content area

### Session 16 — Brand Profile Setup UI
**Model: Sonnet**

- [ ] Onboarding flow: name, industry, audience
- [ ] Brand guidelines editor (rich text or structured form)
- [ ] Tone of voice selector (presets + custom)
- [ ] Connected accounts management (connect/disconnect per platform)
- [ ] Settings page

### Session 17 — Content Generation UI
**Model: Sonnet**

- [ ] Content creation wizard: topic input → idea selection → draft review
- [ ] Platform adaptation preview (see all platform versions side by side)
- [ ] Inline editing with cascade (edit source → platforms re-adapt)
- [ ] Image generation panel
- [ ] Content version history

### Session 18 — Content Calendar + Scheduling
**Model: Sonnet**

- [ ] Calendar view (month/week/day)
- [ ] Drag-and-drop scheduling
- [ ] Scheduled post management (edit, cancel, reschedule)
- [ ] Post status indicators (draft, scheduled, published, failed)

### Session 19 — Dashboard + Analytics
**Model: Sonnet**

- [ ] Activity feed (recent generations, publications)
- [ ] Content stats (generated, published, scheduled)
- [ ] Platform connection status
- [ ] Quick actions (new content, schedule, etc.)

### Session 20 — Polish + Edge Cases
**Model: Sonnet → Opus for stubborn bugs**

- [ ] Loading states, error states, empty states
- [ ] Responsive design (mobile-friendly)
- [ ] Accessibility audit
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] End-to-end smoke test of full workflow

---

## Phase 7: Production Readiness (Sessions 21–23)

### Session 21 — Testing
**Model: Sonnet**

- [ ] API integration tests (auth, content, publishing)
- [ ] Unit tests for business logic (prompt builder, cascade, token encryption)
- [ ] Mock external APIs (Claude, OpenAI, social platforms)
- [ ] CI pipeline (GitHub Actions)

### Session 22 — Deployment Setup
**Model: Sonnet**

- [ ] Dockerfile for API
- [ ] Dockerfile for web
- [ ] Docker Compose for full stack (dev + prod)
- [ ] Environment variable management
- [ ] Database migration strategy for production
- [ ] Health check endpoints

### Session 23 — Security Hardening
**Model: Sonnet → Opus for security review**

- [ ] Token encryption audit
- [ ] CORS policy review
- [ ] Rate limiting tuning
- [ ] Input sanitization review
- [ ] Dependency audit (`npm audit`)
- [ ] OWASP checklist pass

---

## Session Workflow Template

Start each session with this prompt:

```
I'm building the AI Content Generation Platform.
Spec: CONTENT-PLATFORM-ARCHITECTURE.md + TECHNICAL-SPECIFICATION.md
Plan: IMPLEMENTATION-PLAN.md

I'm on Phase X, Session Y: [session name].
Here's what's done: [list completed phases/sessions].
Here's the task list for this session: [paste checkboxes].

Please implement these items. Commit when done.
```

This gives the AI full context without needing to re-explain the project.

---

## Estimated Timeline

| Pace | Sessions/day | Total time |
|---|---|---|
| Intensive | 3-4 | ~1 week |
| Steady | 1-2 | 2-3 weeks |
| Casual | 3-4/week | 5-6 weeks |

**Total sessions: ~23** (mostly Sonnet = generous daily allowance)
