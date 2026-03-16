# AI Content Generation Platform — Technical Specification

> Companion to `CONTENT-PLATFORM-ARCHITECTURE.md`. This document covers the concrete implementation: project structure, interfaces, packages, API integrations, and mobile app strategy.

---

## 1. Core Stack

| Layer | Choice | Why |
|---|---|---|
| **Runtime** | Node.js 22 LTS + TypeScript 5.x | JS ecosystem, your comfort zone, strong async story |
| **HTTP Framework** | **Fastify** | Plugin encapsulation maps 1:1 to service modules; built-in JSON Schema validation; 2-3x throughput over Express; first-class TypeScript |
| **ORM** | **Drizzle ORM** | Type-safe SQL (no magic), schemas defined in TS, plain SQL migrations you review in PRs, no runtime engine overhead |
| **DB Driver** | `postgres` (postgres.js) | Fastest pure-JS Postgres driver, pipelining support |
| **Database** | PostgreSQL 16 | JSONB, row-level security, proven reliability |
| **Cache / Queue** | Redis 7 + BullMQ | Job queues for async LLM calls, image gen, scheduled publishing |
| **Auth** | `@fastify/jwt` + `arctic` (OAuth) + `argon2` | JWT access/refresh tokens; Arctic handles OAuth2 PKCE for social platforms without Passport bloat |
| **Validation** | Zod → `zod-to-json-schema` | Single source of truth for validation, converted to Fastify's JSON Schema at registration |
| **LLM** | `@anthropic-ai/sdk` (Claude API) | Strong instruction-following, structured output, prompt caching |
| **Image Gen** | OpenAI DALL-E 3 API (via `openai` SDK) | Best quality for social media images, reliable API |
| **Object Storage** | S3 / Cloudflare R2 via `@aws-sdk/client-s3` | Generated images |
| **Logging** | Pino (built into Fastify) | Structured JSON logs, fast |
| **Testing** | Vitest | Fast, native TS, compatible with Node test patterns |

---

## 2. Monorepo Structure

```
content-platform/
├── package.json                    # Workspace root
├── turbo.json                      # Turborepo config (build/test orchestration)
├── tsconfig.base.json              # Shared TS config
│
├── packages/
│   └── shared/                     # Shared types, constants, validation schemas
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types/
│           │   ├── user.ts         # User, BrandProfile interfaces
│           │   ├── content.ts      # ContentSession, GeneratedItem, ContentVersion
│           │   ├── feedback.ts     # Feedback, FeedbackAction
│           │   ├── example.ts      # Example, PerformanceMetrics
│           │   ├── social.ts       # SocialPlatform, OAuthConnection
│           │   └── index.ts
│           ├── constants/
│           │   ├── platforms.ts    # Platform configs (char limits, image sizes, etc.)
│           │   └── enums.ts        # Shared enums as const objects
│           ├── validation/
│           │   ├── content.ts      # Zod schemas for content operations
│           │   ├── user.ts         # Zod schemas for user/profile
│           │   └── feedback.ts     # Zod schemas for feedback
│           └── index.ts
│
├── apps/
│   ├── api/                        # Fastify backend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   ├── drizzle.config.ts
│   │   ├── drizzle/               # Generated SQL migrations (committed)
│   │   │   ├── 0000_init.sql
│   │   │   └── meta/
│   │   └── src/
│   │       ├── index.ts           # Entry point: build & start server
│   │       ├── app.ts             # Fastify instance creation, plugin registration
│   │       │
│   │       ├── config/
│   │       │   ├── env.ts         # Zod-validated env config (fail-fast on missing vars)
│   │       │   └── constants.ts   # API-specific constants
│   │       │
│   │       ├── db/
│   │       │   ├── client.ts      # Drizzle client + connection pool
│   │       │   ├── schema.ts      # Re-exports all table definitions
│   │       │   └── seed.ts        # Dev seed data
│   │       │
│   │       ├── plugins/
│   │       │   ├── jwt.ts         # @fastify/jwt registration
│   │       │   ├── redis.ts       # ioredis client as Fastify plugin
│   │       │   ├── cors.ts        # CORS config
│   │       │   ├── swagger.ts     # OpenAPI docs at /docs
│   │       │   └── rate-limit.ts  # @fastify/rate-limit (Redis-backed)
│   │       │
│   │       ├── middleware/
│   │       │   ├── auth.ts        # JWT verification hook + user decorator
│   │       │   ├── role-guard.ts  # Role-based access (future: admin, user)
│   │       │   └── error-handler.ts # Global error handler with request IDs
│   │       │
│   │       ├── services/
│   │       │   ├── auth/
│   │       │   │   ├── auth.plugin.ts      # Fastify plugin (public surface)
│   │       │   │   ├── auth.routes.ts      # POST /register, /login, /refresh, /logout
│   │       │   │   ├── auth.service.ts     # Business logic (hash, verify, issue tokens)
│   │       │   │   ├── auth.schema.ts      # Zod request/response schemas
│   │       │   │   ├── auth.table.ts       # Drizzle: users, refresh_tokens tables
│   │       │   │   └── oauth/
│   │       │   │       ├── twitter.ts      # X/Twitter OAuth 2.0 PKCE flow
│   │       │   │       ├── linkedin.ts     # LinkedIn OAuth 2.0
│   │       │   │       ├── meta.ts         # Instagram + Facebook (Meta Graph API)
│   │       │   │       └── oauth.routes.ts # GET /connect, /callback per platform
│   │       │   │
│   │       │   ├── user/
│   │       │   │   ├── user.plugin.ts
│   │       │   │   ├── user.routes.ts      # GET/PATCH /me, PUT /brand-guidelines, /tone
│   │       │   │   ├── user.service.ts
│   │       │   │   ├── user.schema.ts
│   │       │   │   └── user.table.ts       # Drizzle: brand_profiles, social_accounts
│   │       │   │
│   │       │   ├── content/
│   │       │   │   ├── content.plugin.ts
│   │       │   │   ├── content.routes.ts   # POST /ideate, /draft, /adapt, /generate-images
│   │       │   │   ├── content.service.ts  # Orchestrates the pipeline
│   │       │   │   ├── content.schema.ts
│   │       │   │   ├── content.table.ts    # Drizzle: content_sessions, generated_items, content_versions
│   │       │   │   └── pipeline/
│   │       │   │       ├── ideation.ts     # Step 1: generate topic ideas
│   │       │   │       ├── drafting.ts     # Step 2: full content draft
│   │       │   │       ├── adaptation.ts   # Step 3: platform-specific posts
│   │       │   │       ├── image-gen.ts    # Step 4: image generation
│   │       │   │       ├── cascade.ts      # Edit → re-adapt logic
│   │       │   │       └── prompt-builder.ts # Dynamic prompt assembly from user context
│   │       │   │
│   │       │   ├── feedback/
│   │       │   │   ├── feedback.plugin.ts
│   │       │   │   ├── feedback.routes.ts  # POST /feedback, GET /summary, /history
│   │       │   │   ├── feedback.service.ts
│   │       │   │   ├── feedback.schema.ts
│   │       │   │   └── feedback.table.ts   # Drizzle: feedback (append-only)
│   │       │   │
│   │       │   ├── examples/
│   │       │   │   ├── examples.plugin.ts
│   │       │   │   ├── examples.routes.ts  # GET /examples, DELETE /examples/:id
│   │       │   │   ├── examples.service.ts
│   │       │   │   ├── examples.schema.ts
│   │       │   │   └── examples.table.ts   # Drizzle: examples
│   │       │   │
│   │       │   └── publishing/
│   │       │       ├── publishing.plugin.ts
│   │       │       ├── publishing.routes.ts # POST /publish, /schedule, GET /history
│   │       │       ├── publishing.service.ts
│   │       │       ├── publishing.schema.ts
│   │       │       └── adapters/
│   │       │           ├── twitter.ts      # X/Twitter posting adapter
│   │       │           ├── linkedin.ts     # LinkedIn posting adapter
│   │       │           ├── instagram.ts    # Instagram posting adapter
│   │       │           ├── facebook.ts     # Facebook posting adapter
│   │       │           └── adapter.interface.ts # Common interface all adapters implement
│   │       │
│   │       ├── jobs/
│   │       │   ├── queue.ts               # BullMQ queue factory + connection
│   │       │   ├── workers/
│   │       │   │   ├── content-pipeline.worker.ts  # Async LLM generation
│   │       │   │   ├── image-gen.worker.ts         # Async image generation
│   │       │   │   ├── social-publish.worker.ts    # Scheduled + immediate posting
│   │       │   │   └── preference-analysis.worker.ts # Periodic feedback → preference extraction
│   │       │   └── schedules/
│   │       │       └── token-refresh.ts    # Cron: refresh expiring OAuth tokens
│   │       │
│   │       └── shared/
│   │           ├── errors.ts              # Custom error classes (NotFound, Unauthorized, etc.)
│   │           ├── logger.ts              # Pino instance
│   │           ├── pagination.ts          # Cursor-based pagination helper
│   │           ├── encryption.ts          # AES-256-GCM encrypt/decrypt for OAuth tokens
│   │           └── llm/
│   │               ├── client.ts          # Anthropic SDK wrapper
│   │               └── output-parser.ts   # Zod-based structured output parsing
│   │
│   ├── web/                        # Next.js frontend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   └── src/
│   │       ├── app/               # App Router
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx       # Landing / login
│   │       │   ├── dashboard/
│   │       │   │   └── page.tsx   # Main content creation interface
│   │       │   ├── onboarding/
│   │       │   │   └── page.tsx   # Profile setup wizard
│   │       │   ├── review/
│   │       │   │   └── page.tsx   # Swipe interface + inline editing
│   │       │   ├── history/
│   │       │   │   └── page.tsx   # Past content + examples
│   │       │   └── settings/
│   │       │       └── page.tsx   # Profile, brand, connected accounts
│   │       ├── components/
│   │       │   ├── SwipeCard.tsx       # Tinder-style swipe component
│   │       │   ├── InlineEditor.tsx    # Tap-to-edit text component
│   │       │   ├── PlatformPreview.tsx # Platform-specific content preview
│   │       │   ├── VoiceInput.tsx      # Microphone button + speech-to-text
│   │       │   └── CascadeProgress.tsx # Re-adaptation progress indicator
│   │       ├── hooks/
│   │       │   ├── useSwipe.ts        # Gesture handling
│   │       │   ├── useVoiceEdit.ts    # Voice-to-edit integration
│   │       │   └── useApi.ts          # API client wrapper
│   │       └── lib/
│   │           ├── api-client.ts      # Typed fetch wrapper using shared types
│   │           └── auth.ts            # JWT token management
│   │
│   └── mobile/                     # Expo (React Native) app
│       ├── package.json
│       ├── tsconfig.json
│       ├── app.config.ts           # Expo config
│       ├── eas.json                # EAS Build config
│       └── src/
│           ├── app/                # Expo Router (file-based routing)
│           │   ├── _layout.tsx
│           │   ├── index.tsx       # Login
│           │   ├── (tabs)/
│           │   │   ├── create.tsx  # Content creation
│           │   │   ├── review.tsx  # Swipe + inline edit
│           │   │   └── history.tsx # Past content
│           │   └── settings.tsx
│           ├── components/
│           │   ├── SwipeCard.tsx   # Native gesture-based swipe (react-native-gesture-handler)
│           │   ├── InlineEditor.tsx
│           │   ├── VoiceInput.tsx  # expo-speech / expo-av
│           │   └── PlatformPreview.tsx
│           └── lib/
│               ├── api-client.ts  # Same interface as web, React Native fetch
│               └── auth.ts        # Secure token storage (expo-secure-store)
│
└── tooling/
    ├── eslint-config/              # Shared ESLint config
    └── tsconfig/                   # Shared TS configs
```

---

## 3. Core TypeScript Interfaces

> Defined in `packages/shared/src/types/` — used by API, web, and mobile.

```typescript
// ─── Enums (const objects for tree-shaking) ───

export const SocialPlatform = {
  TWITTER: 'twitter',
  LINKEDIN: 'linkedin',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  TIKTOK: 'tiktok',
} as const;
export type SocialPlatform = (typeof SocialPlatform)[keyof typeof SocialPlatform];

export const ContentStatus = {
  IDEATION: 'ideation',
  DRAFTING: 'drafting',
  ADAPTING: 'adapting',
  IMAGING: 'imaging',
  REVIEW: 'review',
  PUBLISHED: 'published',
} as const;
export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus];

export const FeedbackAction = {
  APPROVE: 'approve',
  REJECT: 'reject',
  REQUEST_REVISION: 'request_revision',
} as const;
export type FeedbackAction = (typeof FeedbackAction)[keyof typeof FeedbackAction];

export const ContentType = {
  THOUGHT_LEADERSHIP: 'thought_leadership',
  PRODUCT_UPDATE: 'product_update',
  PERSONAL_STORY: 'personal_story',
  EDUCATIONAL: 'educational',
  PROMOTIONAL: 'promotional',
} as const;
export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export const EditType = {
  AI_GENERATED: 'ai_generated',
  USER_EDITED: 'user_edited',
  VOICE_EDITED: 'voice_edited',
  CASCADE: 'cascade',
} as const;
export type EditType = (typeof EditType)[keyof typeof EditType];

// ─── Core Domain Models ───

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  planTier: 'free' | 'pro' | 'team';
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandProfile {
  id: string;
  userId: string;
  jobTitle: string | null;
  industry: string | null;
  toneOfVoice: string[];           // ["professional", "witty", "approachable"]
  brandKeywords: string[];          // words to USE
  avoidKeywords: string[];          // words to AVOID
  brandGuidelines: string | null;   // free-form text or uploaded doc reference
  targetAudience: string | null;
  contentThemes: string[];          // preferred topics
  platforms: SocialPlatform[];      // active platforms
  updatedAt: Date;
}

export interface OAuthConnection {
  id: string;
  userId: string;
  platform: SocialPlatform;
  platformUserId: string;
  platformUsername: string | null;
  scopes: string;
  connectedAt: Date;
  tokenExpiresAt: Date | null;
  // NOTE: access_token and refresh_token are NEVER in this interface
  // They are encrypted in the DB and only decrypted in the publishing adapter
}

export interface ContentSession {
  id: string;
  userId: string;
  inputParagraph: string;
  contentType: ContentType;
  targetPlatforms: SocialPlatform[];
  status: ContentStatus;
  pipelineMetadata: PipelineMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineMetadata {
  model: string;                    // e.g. "claude-sonnet-4-6"
  ideationCompletedAt: Date | null;
  draftingCompletedAt: Date | null;
  adaptationCompletedAt: Date | null;
  imagingCompletedAt: Date | null;
  totalTokensUsed: number;
}

export interface GeneratedItem {
  id: string;
  sessionId: string;
  step: 'idea' | 'draft' | 'adaptation' | 'image';
  platform: SocialPlatform | null;  // null for ideas/drafts
  content: string;                   // the generated text
  headline: string | null;           // for platform posts
  imageUrl: string | null;           // for image items
  imagePrompt: string | null;        // the prompt used to generate the image
  hashtags: string[];
  currentVersionId: string | null;   // points to latest ContentVersion
  metadata: Record<string, unknown>; // platform-specific extras
  createdAt: Date;
}

export interface ContentVersion {
  id: string;
  itemId: string;
  versionNumber: number;
  content: string;
  editType: EditType;
  sourceVersionId: string | null;    // for cascades: which draft version triggered this
  diffFromPrev: EditDiff[] | null;
  isFinal: boolean;
  createdAt: Date;
}

export interface EditDiff {
  position: number;                  // character offset
  oldText: string;
  newText: string;
}

export interface Feedback {
  id: string;
  userId: string;
  itemId: string;
  versionId: string | null;          // which version was reviewed
  action: FeedbackAction;
  note: string | null;
  createdAt: Date;
  // NO updatedAt — append-only, immutable
}

export interface Example {
  id: string;
  userId: string;
  itemId: string | null;             // linked back to the generated item
  platform: SocialPlatform;
  contentText: string;
  imageUrl: string | null;
  performance: PerformanceMetrics | null;
  publishedAt: Date;
}

export interface PerformanceMetrics {
  likes: number;
  shares: number;
  comments: number;
  impressions: number;
  clicks: number;
  fetchedAt: Date;
}

// ─── Platform Configuration ───

export interface PlatformConfig {
  platform: SocialPlatform;
  maxChars: number;                  // 0 = no limit
  supportsImages: boolean;
  supportsCarousel: boolean;
  supportsVideo: boolean;
  imageAspectRatio: string;          // e.g. "1:1", "16:9"
  imageDimensions: { width: number; height: number };
  hashtagStrategy: 'inline' | 'footer' | 'minimal';
  hookStyle: string;                 // description for LLM prompt
}

export const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  twitter: {
    platform: 'twitter',
    maxChars: 280,
    supportsImages: true,
    supportsCarousel: false,
    supportsVideo: true,
    imageAspectRatio: '16:9',
    imageDimensions: { width: 1200, height: 675 },
    hashtagStrategy: 'minimal',
    hookStyle: 'Punchy, provocative opening. Thread-friendly if longer.',
  },
  linkedin: {
    platform: 'linkedin',
    maxChars: 3000,
    supportsImages: true,
    supportsCarousel: true,
    supportsVideo: true,
    imageAspectRatio: '1.91:1',
    imageDimensions: { width: 1200, height: 627 },
    hashtagStrategy: 'footer',
    hookStyle: 'Professional insight or contrarian take. Data-driven hooks perform well.',
  },
  instagram: {
    platform: 'instagram',
    maxChars: 2200,
    supportsImages: true,
    supportsCarousel: true,
    supportsVideo: true,
    imageAspectRatio: '1:1',
    imageDimensions: { width: 1080, height: 1080 },
    hashtagStrategy: 'footer',
    hookStyle: 'Visual-first. Caption supports the image. Storytelling tone.',
  },
  facebook: {
    platform: 'facebook',
    maxChars: 63206,
    supportsImages: true,
    supportsCarousel: true,
    supportsVideo: true,
    imageAspectRatio: '1.91:1',
    imageDimensions: { width: 1200, height: 630 },
    hashtagStrategy: 'minimal',
    hookStyle: 'Conversational, community-oriented. Questions drive engagement.',
  },
  tiktok: {
    platform: 'tiktok',
    maxChars: 2200,
    supportsImages: true,
    supportsCarousel: true,
    supportsVideo: true,
    imageAspectRatio: '9:16',
    imageDimensions: { width: 1080, height: 1920 },
    hashtagStrategy: 'inline',
    hookStyle: 'Scroll-stopping first line. Casual, authentic, trend-aware.',
  },
};
```

---

## 4. API Integration Details

### 4.1 Anthropic Claude API (Content Generation)

```
Package: @anthropic-ai/sdk
Model:   claude-sonnet-4-6 (daily content generation — $3/$15 per MTok)
         claude-haiku-4-5  (high-volume formatting, classification — $0.80/$4 per MTok)
         claude-opus-4-6   (preference analysis batch jobs — $15/$75 per MTok, 50% off via Batch API)
```

**Structured output** (constrained decoding, not just prompting):

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// Approach 1: Strict tool use for guaranteed schema compliance
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  tools: [{
    name: 'generate_social_posts',
    description: 'Generate platform-specific social media posts',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        twitter: { type: 'object', properties: {
          text: { type: 'string', description: 'Tweet text, max 280 chars' },
          hashtags: { type: 'array', items: { type: 'string' } },
        }, required: ['text', 'hashtags'], additionalProperties: false },
        linkedin: { type: 'object', properties: {
          text: { type: 'string' },
        }, required: ['text'], additionalProperties: false },
      },
      required: ['twitter', 'linkedin'],
      additionalProperties: false,
    },
  }],
  tool_choice: { type: 'tool', name: 'generate_social_posts' },
  messages: [{ role: 'user', content: userPrompt }],
});

const toolUseBlock = response.content.find(b => b.type === 'tool_use');
const posts = toolUseBlock?.input; // Guaranteed to match schema
```

**Prompt caching:** Use `cache_control` on the system prompt (brand guidelines + examples) — stays constant across pipeline steps for the same user.
- Cache **read**: 0.1x input price (90% savings)
- Cache **write**: 1.25x (5-min TTL) or 2x (1-hour TTL)

```typescript
// Prompt caching example
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: [{
    type: 'text',
    text: longBrandGuidelinesAndExamples, // large, repeated context
    cache_control: { type: 'ephemeral' },
  }],
  messages: [{ role: 'user', content: 'Write today\'s post.' }],
});
// Check: response.usage.cache_read_input_tokens

// Streaming for real-time UI updates
const stream = anthropic.messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }],
});
for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    emitToClient(event.delta.text); // SSE or WebSocket to frontend
  }
}
```

**Batch API** for preference analysis: 50% discount on both input and output tokens, processed within 24 hours. Use for the periodic job that analyzes feedback corpus to extract preference summaries.

### 4.2 Social Media Platform APIs

#### Twitter/X API v2

```
Package:  twitter-api-v2 (npm, v1.29+)
Auth:     OAuth 2.0 with PKCE (user-context)
Scopes:   tweet.read, tweet.write, media.write, users.read, offline.access
Pricing:  Free ($0) — ~500 posts/mo, write-only, no read
          Basic ($200/mo) — 50K posts/mo
          Pro ($5,000/mo) — full access
Post:     POST /2/tweets  { "text": "...", "media": { "media_ids": ["..."] } }
Media:    POST /2/media/upload (v2 as of mid-2025; v1.1 deprecated)
Limits:   15-min windows on Basic/Pro; 24-hour windows on Free (very restrictive)
Tokens:   Access tokens expire in 2 hours; refresh tokens are long-lived
```

```typescript
import { TwitterApi } from 'twitter-api-v2';

// OAuth 2.0 PKCE flow
const client = new TwitterApi({ clientId: config.X_CLIENT_ID, clientSecret: config.X_CLIENT_SECRET });
const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
  config.X_CALLBACK_URL,
  { scope: ['tweet.read', 'tweet.write', 'media.write', 'users.read', 'offline.access'] }
);
// Store codeVerifier + state in session, redirect user to `url`

// Callback: exchange code for tokens
const { accessToken, refreshToken } = await client.loginWithOAuth2({
  code: callbackCode, codeVerifier: storedCodeVerifier, redirectUri: config.X_CALLBACK_URL,
});

// Post with media
const authedClient = new TwitterApi(accessToken);
const mediaId = await authedClient.v2.uploadMedia(imageBuffer, { mimeType: 'image/png' });
await authedClient.v2.tweet({ text: 'Hello!', media: { media_ids: [mediaId] } });

// Refresh (2-hour access token lifetime)
const { accessToken: newToken, refreshToken: newRefresh } =
  await client.refreshOAuth2Token(refreshToken);
```

**Gotchas:**
- `media.write` scope is required for image upload — often missed, causes silent failures
- Authorization URL changed from `twitter.com` to `x.com` — old URL fails
- Free tier cannot read tweets at all; Basic ($200/mo) is minimum for production
- App-only Bearer tokens **cannot** post — must use User Context auth

#### LinkedIn API

```
Package:  No official SDK — use undici/axios directly
Auth:     OAuth 2.0 (3-legged, authorization code)
Scopes:   w_member_social (personal posting), w_organization_social (company pages)
Post:     POST /rest/posts (versioned API — replaces deprecated ugcPosts)
Headers:  Linkedin-Version: 202504, X-Restli-Protocol-Version: 2.0.0 (mandatory)
Media:    3-step: initializeUpload → PUT binary → reference URN in post
Limits:   100 posts/day per member
Tokens:   Access tokens last 60 days; refresh tokens ONLY with Community Management API
          (requires legally registered business entity)
```

```typescript
const LINKEDIN_VERSION = '202504';
const headers = {
  Authorization: `Bearer ${accessToken}`,
  'Linkedin-Version': LINKEDIN_VERSION,
  'X-Restli-Protocol-Version': '2.0.0',
};

// Image upload: 3-step flow
const initRes = await axios.post(
  'https://api.linkedin.com/rest/images?action=initializeUpload',
  { initializeUploadRequest: { owner: `urn:li:person:${personId}` } },
  { headers }
);
const { uploadUrl, image } = initRes.data.value;
await axios.put(uploadUrl, imageBuffer, { headers: { 'Content-Type': 'image/png' } });

// Create post with image
await axios.post('https://api.linkedin.com/rest/posts', {
  author: `urn:li:person:${personId}`,
  lifecycleState: 'PUBLISHED',
  visibility: 'PUBLIC',
  commentary: 'Post text here',
  distribution: { feedDistribution: 'MAIN_FEED' },
  content: { media: { id: image, title: 'Post image' } },
}, { headers });
```

**Gotchas:**
- API versioning is **mandatory** — unversioned requests fail
- No refresh tokens without Community Management API product (business entity required) — must re-auth before 60-day expiry
- Cannot pass external image URLs — must upload through LinkedIn's 3-step process
- Company page posting requires `w_organization_social` + user must be page admin

#### Instagram Graph API (via Meta)

```
Package:  No official SDK — use undici/axios directly
Auth:     Facebook Login (OAuth 2.0) → exchange short-lived (~1hr) for long-lived (60 days)
Scopes:   instagram_basic, instagram_content_publish, pages_show_list
Post:     2-step: POST /{ig-user-id}/media → POST /{ig-user-id}/media_publish
Limits:   ~25 API publishing calls per 24 hours
Requires: Business or Creator account linked to a Facebook Page
```

```typescript
const BASE = 'https://graph.facebook.com/v21.0';

// Single image post (2-step)
const container = await axios.post(`${BASE}/${igUserId}/media`, {
  image_url: 'https://your-s3-bucket.com/image.jpg', // must be publicly accessible
  caption: 'Post caption here #hashtag',
  alt_text: 'Accessibility description',
  access_token: longLivedToken,
});
await axios.post(`${BASE}/${igUserId}/media_publish`, {
  creation_id: container.data.id,
  access_token: longLivedToken,
});

// Carousel post
const item1 = await axios.post(`${BASE}/${igUserId}/media`, {
  image_url: 'https://example.com/img1.jpg', is_carousel_item: true, access_token: longLivedToken,
});
const item2 = await axios.post(`${BASE}/${igUserId}/media`, {
  image_url: 'https://example.com/img2.jpg', is_carousel_item: true, access_token: longLivedToken,
});
const carousel = await axios.post(`${BASE}/${igUserId}/media`, {
  media_type: 'CAROUSEL', children: [item1.data.id, item2.data.id],
  caption: 'Swipe through!', access_token: longLivedToken,
});
await axios.post(`${BASE}/${igUserId}/media_publish`, {
  creation_id: carousel.data.id, access_token: longLivedToken,
});

// Token refresh (before 60-day expiry)
const refreshRes = await axios.get(`${BASE}/oauth/access_token`, {
  params: { grant_type: 'fb_exchange_token', client_id: config.META_APP_ID,
    client_secret: config.META_APP_SECRET, fb_exchange_token: longLivedToken },
});
```

**Gotchas:**
- **Cannot upload binary data directly** — images must be at a publicly accessible URL that Meta fetches (upload to S3/R2 first)
- Personal accounts cannot use the API — Business or Creator account required
- Basic Display API was fully removed December 2024
- Stories and Reels are publishable via API (since 2022-2023)
- Meta App Review is required for production use with `instagram_content_publish`

#### Facebook Graph API

```
Package:  No official SDK — use undici/axios directly
Auth:     Same Meta OAuth 2.0 flow as Instagram
Scopes:   pages_manage_posts, pages_read_engagement
Post:     POST /{page-id}/feed (text) or POST /{page-id}/photos (image)
Limits:   200 posts/hour per page
```

```typescript
// Get page access token from user token
const pagesRes = await axios.get(`${BASE}/me/accounts`, {
  params: { access_token: userAccessToken },
});
const page = pagesRes.data.data.find((p: any) => p.id === targetPageId);
const pageAccessToken = page.access_token;

// Post with image
await axios.post(`${BASE}/${targetPageId}/photos`, {
  url: 'https://example.com/image.jpg',
  message: 'Post text here',
  access_token: pageAccessToken,
});
```

**Gotchas:**
- **Personal profile posting via API is dead** — Meta removed this years ago. Posting is to Pages only.
- Users must be Page admins
- Page tokens derived from user tokens inherit the user token's expiry unless you get a "never-expiring" page token
- App Review required for production use with `pages_manage_posts`

#### TikTok Content Posting API

```
Package:  No official SDK — use undici/axios directly
Auth:     OAuth 2.0 with user authorization
Scopes:   video.publish (requires app approval)
Post:     POST /v2/post/publish/video/init/ or /content/init/
Status:   GET /v2/post/publish/status/fetch/
```

**Gotchas:**
- App review takes 5-10 business days — cannot start posting immediately
- Unaudited apps may be restricted to **private visibility**
- Photo/carousel posting is newer and less documented than video
- Content violating TikTok guidelines is rejected at the API level
- No mature community SDK — raw HTTP only

**Recommendation:** Deprioritize TikTok to Phase 7+ given the gated access and immature API.

#### Token Lifetime Summary

| Platform | Access Token | Refresh Token | Notes |
|---|---|---|---|
| X/Twitter | 2 hours | Long-lived | Refresh before expiry via cron |
| LinkedIn | 60 days | Only with Community Management product | Re-auth flow needed without refresh |
| Meta (IG + FB) | ~1 hour (short), 60 days (long-lived) | Refreshable via token exchange | Exchange short → long immediately |
| TikTok | Varies by scope | Available | Standard OAuth refresh |

#### Social Platform Adapter Interface

All platforms implement a common interface (`apps/api/src/services/publishing/adapters/adapter.interface.ts`):

```typescript
export interface SocialPostPayload {
  text: string;
  imageUrl?: string;        // URL of image in our object storage
  hashtags?: string[];
  altText?: string;         // image alt text for accessibility
}

export interface SocialPostResult {
  platform: SocialPlatform;
  platformPostId: string;
  postUrl: string;
  publishedAt: Date;
}

export interface SocialAdapter {
  platform: SocialPlatform;
  post(userId: string, payload: SocialPostPayload): Promise<SocialPostResult>;
  validateConnection(userId: string): Promise<boolean>;
  refreshToken(userId: string): Promise<void>;
}
```

### 4.3 Image Generation

| Provider | Model | Cost/Image | Quality | API Maturity | Best For |
|---|---|---|---|---|---|
| **OpenAI** | GPT Image 1 | $0.005-$0.04 | Good | Stable, official SDK | Default choice — reliable, affordable |
| **Stability AI** | SD 3.5 Large | ~$0.01-$0.03 (via Replicate) | Good | Stable | Fine-tuning, LoRA, custom styles |
| **Flux** | Flux 2 Pro | $0.055 (via Replicate) | Top scores | Newer | Highest quality when cost isn't primary |
| **Midjourney** | — | Subscription only | Best artistic | **No official API** | Avoid for programmatic use |

**Recommendation:** Start with **OpenAI GPT Image 1** ($0.005-$0.04/image). Best balance of cost, quality, prompt adherence, and API reliability. Consider Stability AI later if you need brand-specific fine-tuning.

```typescript
import OpenAI from 'openai';

const openai = new OpenAI(); // reads OPENAI_API_KEY from env

export async function generateImage(
  prompt: string,
  size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024',
): Promise<string> {
  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size,
    quality: 'medium',       // 'low' | 'medium' | 'high'
  });
  // Download image URL → upload to our S3/R2 → return our permanent URL
  return uploadToStorage(response.data[0].url!);
}
```

### 4.4 OAuth Token Security

```typescript
// apps/api/src/shared/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(config.TOKEN_ENCRYPTION_KEY, 'hex'); // 32 bytes

export function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all base64)
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decrypt(encoded: string): string {
  const [ivB64, tagB64, dataB64] = encoded.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(dataB64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
```

Token refresh runs as a cron job (`jobs/schedules/token-refresh.ts`) that checks for tokens expiring within 24 hours and proactively refreshes them.

---

## 5. Middleware Stack

Registered in order in `app.ts`:

```typescript
// apps/api/src/app.ts
import Fastify from 'fastify';

export async function buildApp() {
  const app = Fastify({
    logger: true,           // Pino logging
    genReqId: () => crypto.randomUUID(),
  });

  // 1. CORS
  await app.register(import('./plugins/cors'));

  // 2. Rate limiting (Redis-backed)
  await app.register(import('./plugins/rate-limit'));

  // 3. JWT
  await app.register(import('./plugins/jwt'));

  // 4. Redis client
  await app.register(import('./plugins/redis'));

  // 5. OpenAPI docs
  await app.register(import('./plugins/swagger'));

  // 6. Global error handler
  app.setErrorHandler(errorHandler);

  // 7. Service plugins (each registers its own routes)
  await app.register(import('./services/auth/auth.plugin'), { prefix: '/auth' });
  await app.register(import('./services/user/user.plugin'), { prefix: '/users' });
  await app.register(import('./services/content/content.plugin'), { prefix: '/content' });
  await app.register(import('./services/feedback/feedback.plugin'), { prefix: '/feedback' });
  await app.register(import('./services/examples/examples.plugin'), { prefix: '/examples' });
  await app.register(import('./services/publishing/publishing.plugin'), { prefix: '/publish' });

  return app;
}
```

**Rate limit overrides for expensive endpoints:**

```typescript
// Inside content.routes.ts
app.post('/ideate', {
  config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
  preHandler: [app.authenticate],
  handler: ideateHandler,
});
```

---

## 6. Mobile App Strategy: Expo (React Native)

### Why Expo Over Alternatives

| Approach | Verdict | Why Not |
|---|---|---|
| **PWA** | Disqualified | Swipe gesture performance limited by browser JS thread — can't match native. iOS push notifications remain second-class (no badge counts, unreliable background delivery). No App Store presence. |
| **Capacitor (Ionic)** | Disqualified | Same WebView gesture limitations as PWA. Good for wrapping dashboards, not for gesture-heavy interactive UX. |
| **Bare React Native** | Overkill | Same capabilities as Expo but you own Xcode/Android Studio config, CocoaPods, Gradle — solo devs lose weeks. No OTA updates without third-party services. |
| **Flutter** | Wrong fit | Excellent framework, but team knows TS not Dart. Can't share types, API clients, or validation schemas with Next.js web app. Maintaining two type systems doubles bug surface. |
| **Expo** | **Winner** | File-based routing (Expo Router) mirrors Next.js. EAS Build handles Xcode/Gradle in the cloud. OTA updates for JS-only fixes. Native-thread gestures via gesture-handler + reanimated. Full TypeScript sharing via monorepo. |

### Why Expo

| Consideration | Expo Wins |
|---|---|
| **JS/TS knowledge** | Same language as API and web app |
| **Swipe gestures** | `react-native-gesture-handler` + `react-native-reanimated` — 60fps native-thread gestures, same libraries Tinder/Bumble use |
| **Voice input** | `@react-native-voice/voice` for on-device STT (short commands); Whisper/Deepgram server-side for longer dictation |
| **Push notifications** | `expo-notifications` — handles both APNs (iOS) and FCM (Android) with unified API |
| **Offline support** | `expo-sqlite` for local drafts, `@tanstack/react-query` with persistence, `NetInfo` for connectivity-aware sync |
| **Type sharing** | Monorepo — mobile imports from `packages/shared` directly |
| **Deployment** | EAS Build (cloud builds, no local Xcode/Android Studio), TestFlight + Play Console beta, OTA updates bypass store review |
| **File-based routing** | Expo Router — same mental model as Next.js App Router |

### Shared Code Between Web and Mobile

The monorepo structure means all three apps (API, web, mobile) share:
- **TypeScript interfaces** from `packages/shared`
- **Zod validation schemas** (same validation client + server)
- **Platform constants** (char limits, image sizes)
- **API client types** (request/response shapes)

The UI components are NOT shared (React DOM vs React Native), but the hooks and business logic can be similar. The API client uses plain `fetch` — works in both Next.js and React Native without polyfills.

### Swipe UX Implementation

```typescript
// apps/mobile/src/components/SwipeCard.tsx
// Uses react-native-gesture-handler + react-native-reanimated
// for 60fps native-thread gesture processing

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Pan gesture with spring physics (damping: 15, stiffness: 100)
// Swipe right > 120px → approve + haptic feedback
// Swipe left > 120px → reject + haptic feedback
// Release within threshold → spring back to center
// Render 3 cards in absolute-positioned stack with decreasing scale for depth
```

### Offline Mode

1. **Local drafts** — `expo-sqlite` stores content drafts that work without connectivity
2. **Feedback queue** — swipes stored locally, synced when online via `NetInfo` connection listener
3. **Persisted cache** — `@tanstack/react-query` with persistence — previously loaded content available offline
4. **Background sync** — `expo-background-fetch` pushes pending changes when connectivity returns
5. **Visual sync status** — synced / pending / conflict indicators so user always knows state

### Push Notifications

```
User starts content generation → API kicks off BullMQ job →
Job completes → API sends push via expo-server-sdk (Node.js) →
User's phone shows "Your content is ready for review" →
Tap → deep link via Expo Router → opens review screen with swipe cards
```

### Deployment Strategy

| Stage | Command | Delivers To |
|---|---|---|
| Development | `npx expo start` (Expo Go) | Local device/simulator |
| Beta | `eas build --profile preview` + `eas submit` | TestFlight (iOS), Play internal track (Android) |
| Production | `eas build --profile production` + `eas submit` | App Store + Google Play |
| Hot fix | `eas update --branch production` | OTA push, bypasses store review |

### Mobile MVP Effort Estimate

| Component | Time |
|---|---|
| Monorepo setup, Expo config, EAS | 2-3 days |
| Core screens (leveraging shared types/logic) | 2-3 weeks |
| Swipe UX polish (spring physics, haptics, card stacking) | 1-2 weeks |
| Voice input with permissions handling | 3-5 days |
| Push notifications end-to-end | 2-3 days |
| Offline storage and sync | 1-2 weeks |
| First store submission (accounts, signing, review) | 1 week |
| **Total MVP** | **6-10 weeks** |

Ongoing maintenance is ~1.4x the web-only cost. Shared packages (types, API client, validation) are the key factor keeping this manageable.

---

## 7. Development Workflow

### Scripts (`package.json` root)

```json
{
  "scripts": {
    "dev": "turbo dev",
    "dev:api": "turbo dev --filter=api",
    "dev:web": "turbo dev --filter=web",
    "dev:mobile": "turbo dev --filter=mobile",
    "build": "turbo build",
    "test": "turbo test",
    "test:e2e": "turbo test:e2e",
    "db:generate": "turbo db:generate --filter=api",
    "db:migrate": "turbo db:migrate --filter=api",
    "db:seed": "turbo db:seed --filter=api",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck"
  }
}
```

### Environment Setup

```bash
# .env.example (apps/api/)
DATABASE_URL=postgresql://user:pass@localhost:5432/content_platform
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
TOKEN_ENCRYPTION_KEY=<64-char-hex-string>
JWT_SECRET=<random-string>
JWT_REFRESH_SECRET=<different-random-string>

# OAuth credentials per platform
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
META_APP_ID=
META_APP_SECRET=

# Storage
S3_BUCKET=content-platform-images
S3_REGION=us-east-1
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Expo push notifications
EXPO_ACCESS_TOKEN=
```

### Testing Strategy

| Type | Tool | What | DB? |
|---|---|---|---|
| **Unit** | Vitest | Pipeline steps, services, utilities | No (mocked) |
| **Integration** | Vitest + Fastify `inject()` | API routes, auth flows, validation | Yes (test DB, truncated per test) |
| **E2E** | Vitest | Full pipeline: seed user → create session → verify outputs | Yes + mocked LLM/social APIs |
| **Mobile** | Jest + React Native Testing Library | Component rendering, gesture handlers | No |
| **Coverage target** | 80% branches/functions/lines on service + pipeline code | | |

---

## 8. Recommended Build Order (MVP)

This is the order to actually build things, layer by layer:

| Phase | What | Delivers |
|---|---|---|
| **Phase 0** | Monorepo scaffold + shared types + DB schema + config | Foundation |
| **Phase 1** | Auth service (register, login, JWT) + user profile + brand guidelines | Users can sign up and set up their profile |
| **Phase 2** | Content generation pipeline (ideation → drafting → adaptation) + prompt builder | Core value — users can generate content |
| **Phase 3** | Feedback service + swipe UI (web) | Users can approve/reject content |
| **Phase 4** | Inline editing + cascade re-adaptation | Users can tweak content, platforms auto-update |
| **Phase 5** | Examples store + preference learning | System improves over time |
| **Phase 6** | Image generation pipeline | Visual content |
| **Phase 7** | Social OAuth + publishing service (Twitter first, then LinkedIn, then Meta) | Users can actually post |
| **Phase 8** | Mobile app (Expo) — review + swipe + voice-to-edit | On-the-go usage |
| **Phase 9** | Scheduled posting + push notifications | Convenience features |
| **Phase 10** | Analytics dashboard (pull engagement data back) | Close the feedback loop |

---

## 9. Key Package Summary

```
# Runtime
node@22, typescript@5.x, tsx (dev runner)

# HTTP + API
fastify, @fastify/jwt, @fastify/cors, @fastify/rate-limit
@fastify/swagger, @scalar/fastify-api-reference
zod, zod-to-json-schema

# Database
drizzle-orm, drizzle-kit, postgres (postgres.js driver)

# Cache + Queue
ioredis, bullmq, @fastify/schedule, toad-scheduler

# Auth
arctic (OAuth2 PKCE), argon2 (password hashing)

# AI
@anthropic-ai/sdk (Claude), openai (DALL-E 3)

# Storage
@aws-sdk/client-s3

# Testing
vitest, @vitest/coverage-v8

# Mobile
expo, expo-router, react-native-gesture-handler
react-native-reanimated, expo-notifications
expo-secure-store, @tanstack/react-query

# Web
next, react, @tanstack/react-query

# Monorepo
turbo (Turborepo)
```
