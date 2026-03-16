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
Model:   claude-sonnet-4-6 (fast, cost-effective for content generation)
         claude-opus-4-6 (for preference analysis batch jobs)
```

**Integration pattern (`apps/api/src/shared/llm/client.ts`):**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const anthropic = new Anthropic({
  apiKey: config.ANTHROPIC_API_KEY,
});

// Structured output with Zod parsing
export async function generateContent<T>(
  systemPrompt: string,
  userMessage: string,
  outputSchema: z.ZodType<T>,
  options?: { maxTokens?: number; temperature?: number }
): Promise<T> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: options?.maxTokens ?? 4096,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  // Parse JSON from response and validate with Zod
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || [null, text];
  return outputSchema.parse(JSON.parse(jsonMatch[1] ?? text));
}
```

**Prompt caching:** Use `cache_control` on the system prompt (brand guidelines + examples) since it stays constant across pipeline steps for the same user. Saves ~90% on input tokens for subsequent calls in a session.

### 4.2 Social Media Platform APIs

#### Twitter/X API v2

```
Package:  twitter-api-v2 (npm)
Auth:     OAuth 2.0 with PKCE (user-context)
Scopes:   tweet.read, tweet.write, users.read, offline.access
Pricing:  Basic tier ($100/mo) — 50,000 tweets/mo read, 10,000 tweets write
          Pro tier ($5,000/mo) — full access
Post:     POST /2/tweets  { "text": "...", "media": { "media_ids": ["..."] } }
Media:    POST /1.1/media/upload (chunked upload, still v1.1)
Limits:   300 tweets / 15 min (user context), media < 15MB (images)
```

**Key gotcha:** Media upload is still v1.1 API, requires separate OAuth 1.0a or v2 with user context. The `twitter-api-v2` package handles both.

#### LinkedIn API

```
Package:  No official SDK — use undici/fetch directly
Auth:     OAuth 2.0 (3-legged, authorization code flow)
Scopes:   openid, profile, w_member_social (posting), r_basicprofile
Post:     POST /v2/posts (new Posts API, replaces UGC/Shares)
Media:    Register upload → upload binary → reference in post
Limits:   100 posts/day per member, rate limit headers
```

**Key gotcha:** LinkedIn's API changes frequently. The Posts API (v2) replaced the older Shares/UGC API. Image posting requires a 3-step flow: register upload, upload binary to the URL they give you, then reference the asset URN in your post.

#### Instagram Graph API (via Meta)

```
Package:  No official SDK — use undici/fetch directly
Auth:     Facebook Login (OAuth 2.0) → exchange for long-lived token (60 days)
Scopes:   instagram_basic, instagram_content_publish, pages_read_engagement
Post:     2-step: POST /media (create container) → POST /media_publish (publish)
Limits:   25 published posts per 24 hours, business/creator accounts ONLY
```

**Key gotcha:** Instagram API requires a Facebook Page linked to an Instagram Business or Creator account. Personal accounts cannot use the API. Image URLs must be publicly accessible (pre-upload to S3/R2 first).

#### Facebook Graph API

```
Package:  No official SDK — use undici/fetch directly
Auth:     Facebook Login (OAuth 2.0), same flow as Instagram
Scopes:   pages_manage_posts, pages_read_engagement
Post:     POST /{page-id}/feed (text) or POST /{page-id}/photos (with image)
Limits:   200 posts/hour per page
```

**Key gotcha:** Posting is to Pages, not personal profiles (personal profile posting was removed from the API years ago). Users need to be a Page admin.

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

### 4.3 Image Generation (DALL-E 3)

```
Package:  openai (npm)
Model:    dall-e-3
Sizes:    1024x1024, 1024x1792, 1792x1024
Pricing:  $0.040/image (standard), $0.080/image (HD)
Limits:   5 images/min (can request increase)
```

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

export async function generateImage(
  prompt: string,
  size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024',
): Promise<string> {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size,
    quality: 'standard',
    response_format: 'url',
  });
  // Download image URL → upload to our S3/R2 → return our URL
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

### Why Expo

| Consideration | Expo Wins |
|---|---|
| **JS/TS knowledge** | Same language as API and web app |
| **Swipe gestures** | `react-native-gesture-handler` + `react-native-reanimated` — 60fps native gestures, exact same libraries Tinder/Bumble use |
| **Voice input** | `expo-speech` for TTS, `expo-av` + Web Speech API or `@react-native-voice/voice` for speech-to-text |
| **Push notifications** | `expo-notifications` — handles both APNs (iOS) and FCM (Android) with a unified API |
| **Offline support** | `@tanstack/react-query` with persistence, `expo-sqlite` for local queue |
| **Type sharing** | Monorepo — mobile imports from `packages/shared` directly |
| **Deployment** | EAS Build (cloud builds, no local Xcode/Android Studio), TestFlight + Play Console beta, OTA updates for JS-only changes |
| **File-based routing** | Expo Router — same mental model as Next.js App Router |

### Shared Code Between Web and Mobile

The monorepo structure means all three apps (API, web, mobile) share:
- **TypeScript interfaces** from `packages/shared`
- **Zod validation schemas** (same validation client + server)
- **Platform constants** (char limits, image sizes)
- **API client types** (request/response shapes)

The UI components are NOT shared (React DOM vs React Native), but the hooks and business logic can be similar.

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

// Pan gesture with spring physics
// Swipe right > 120px → approve
// Swipe left > 120px → reject
// Release within threshold → spring back to center
```

### Offline Mode

1. Content drafts saved locally (expo-sqlite)
2. Feedback queue — swipes stored locally, synced when online
3. `@tanstack/react-query` persisted cache — previously loaded content available offline
4. Background sync via `expo-background-fetch`

### Push Notifications

```
User starts content generation → API kicks off BullMQ job →
Job completes → API sends push via expo-server-sdk →
User's phone shows "Your content is ready for review" →
Tap → opens review screen with swipe cards
```

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
