# AI Content Generation Platform — Architecture Design

## 1. System Overview

An AI-powered platform that helps users generate social media content tailored to their brand, tone of voice, and target platforms. The system learns from user feedback over time to improve content suggestions.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Web App)                             │
│  ┌──────────┐ ┌──────────────┐ ┌────────────┐ ┌────────────────┐  │
│  │  Auth UI  │ │Content Editor│ │ Swipe/Rate │ │ Post Dashboard │  │
│  └──────────┘ └──────────────┘ └────────────┘ └────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────────┐
│                         API GATEWAY                                 │
│              (Auth middleware, rate limiting, routing)               │
└──┬──────────┬───────────┬───────────┬───────────┬──────────────────┘
   │          │           │           │           │
   ▼          ▼           ▼           ▼           ▼
┌──────┐ ┌────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐
│ Auth │ │ User   │ │Content  │ │Feedback │ │ Social   │
│ Svc  │ │Profile │ │Generate │ │ Svc     │ │Publishing│
│      │ │ Svc    │ │ Svc     │ │         │ │ Svc      │
└──┬───┘ └───┬────┘ └────┬────┘ └────┬────┘ └────┬─────┘
   │         │           │           │            │
   ▼         ▼           ▼           ▼            ▼
┌──────────────────────────────────────────────────────────┐
│                    DATA LAYER                             │
│  ┌──────────┐ ┌──────────────┐ ┌───────────────────────┐│
│  │ User DB  │ │ Content DB   │ │ Social Token Vault    ││
│  │(Postgres)│ │ (Postgres)   │ │ (Encrypted at rest)   ││
│  └──────────┘ └──────────────┘ └───────────────────────┘│
└──────────────────────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   LLM API       │
                    │ (Claude / etc.) │
                    └─────────────────┘
```

---

## 2. Core Services

### 2.1 Authentication Service

Handles user login/signup for the web interface and OAuth token management for social media platforms.

**User Authentication (our platform):**
- Email/password with bcrypt hashing
- JWT access tokens (short-lived, 15 min) + refresh tokens (long-lived, 7 days)
- Optional: OAuth2 login via Google/GitHub for convenience

**Social Media Authentication (posting on behalf of user):**
- OAuth2 flows for each platform (Instagram/Facebook Graph API, X/Twitter OAuth 2.0, LinkedIn, TikTok)
- Tokens encrypted at rest (AES-256) in a dedicated credential vault
- Automatic token refresh before expiry
- Scoping: request only the permissions needed (read profile, publish content)

```
┌─────────────────────────────────────────────────┐
│            Auth Service                          │
│                                                  │
│  POST /auth/register                             │
│  POST /auth/login         → JWT + refresh token  │
│  POST /auth/refresh       → new JWT              │
│  POST /auth/logout        → revoke refresh       │
│                                                  │
│  GET  /auth/social/:platform/connect  → OAuth    │
│  GET  /auth/social/:platform/callback → store    │
│  DELETE /auth/social/:platform        → revoke   │
│  GET  /auth/social/status             → list     │
└─────────────────────────────────────────────────┘
```

### 2.2 User Profile Service

Stores everything the LLM needs to generate on-brand content for a user.

**Profile data:**
- Display name, email, avatar
- Job title / role / industry
- Brand guidelines (uploaded doc or structured fields)
- Tone of voice descriptors (e.g., "professional but approachable", "witty", "authoritative")
- Target audience description
- Connected social platforms + preferences per platform
- Preferred content themes/topics

```
┌─────────────────────────────────────────────────┐
│          User Profile Service                    │
│                                                  │
│  GET    /users/me                                │
│  PATCH  /users/me                                │
│  PUT    /users/me/brand-guidelines               │
│  PUT    /users/me/tone-of-voice                  │
│  GET    /users/me/platforms                       │
│  PATCH  /users/me/platforms/:platform/prefs       │
└─────────────────────────────────────────────────┘
```

### 2.3 Content Generation Service

The core engine. Takes user input and produces platform-specific content through a multi-step LLM pipeline.

**Generation Pipeline:**

```
Step 1: IDEATION
  Input:  user's paragraph + profile (tone, brand, audience)
  Output: 3-5 proposed article topics/angles
  Action: User swipes right/left on each → feedback stored

Step 2: CONTENT DRAFTING
  Input:  selected topic + profile context + approved examples
  Output: Long-form content piece (blog post / article draft)
  Action: User can edit, approve, or regenerate → feedback stored

Step 3: PLATFORM ADAPTATION
  Input:  approved content + target platforms
  Output: Platform-specific versions:
          ┌─────────────┬──────────────────────────────────┐
          │ Platform     │ Adaptation                       │
          ├─────────────┼──────────────────────────────────┤
          │ X/Twitter    │ Thread or single post, hooks,    │
          │              │ ≤280 chars, hashtags             │
          │ LinkedIn     │ Professional tone, longer form,  │
          │              │ strategic hashtags               │
          │ Instagram    │ Caption + image prompt           │
          │ Facebook     │ Conversational, mid-length       │
          │ TikTok       │ Script/caption + hook            │
          └─────────────┴──────────────────────────────────┘
  Action: User swipes on each platform variant → feedback stored

Step 4: IMAGE GENERATION (when applicable)
  Input:  approved content + platform requirements + brand style
  Output: Generated images sized per platform
          (1080x1080 Instagram, 1200x675 Twitter/LinkedIn, etc.)
  Action: User swipes on image options → feedback stored
```

```
┌─────────────────────────────────────────────────────┐
│        Content Generation Service                    │
│                                                      │
│  POST /content/ideate                                │
│    body: { paragraph, platforms[] }                   │
│    returns: { ideas: [{ id, topic, angle, hook }] }  │
│                                                      │
│  POST /content/draft                                 │
│    body: { ideaId }                                   │
│    returns: { draftId, content, summary }             │
│                                                      │
│  POST /content/adapt                                 │
│    body: { draftId, platforms[] }                      │
│    returns: { adaptations: [{ platform, text, ... }] }│
│                                                      │
│  POST /content/generate-images                       │
│    body: { adaptationId, platform, style? }           │
│    returns: { images: [{ id, url, prompt }] }        │
│                                                      │
│  POST /content/regenerate                            │
│    body: { stepId, feedback? }                        │
│    returns: new variant                               │
└─────────────────────────────────────────────────────┘
```

**LLM Prompt Construction:**

Each LLM call builds a system prompt from the user's stored context:

```
SYSTEM PROMPT (assembled per-request):
├── Base instruction (what to generate)
├── User's brand guidelines
├── User's tone of voice
├── Target audience
├── Platform-specific rules
├── Top-rated example content (from examples store, ranked by feedback)
├── Recent positive feedback patterns (from feedback store)
└── Negative feedback patterns to avoid
```

### 2.4 Feedback Service

Tinder-style swipe mechanism. Every generated artifact (topic idea, draft, platform post, image) can be rated.

**Feedback types:**
- **Swipe right (approve):** User likes this output
- **Swipe left (reject):** User dislikes this output
- **Optional text note:** "Too formal", "Love the hook", etc.

**Storage:**
- Every feedback event is immutable (append-only log)
- Linked to: user, content step, generated output, LLM prompt used
- Used to build preference vectors over time

```
┌─────────────────────────────────────────────────────┐
│           Feedback Service                           │
│                                                      │
│  POST /feedback                                      │
│    body: {                                            │
│      contentId,                                       │
│      step: "ideation"|"draft"|"adaptation"|"image",   │
│      rating: "approve" | "reject",                    │
│      note?: string                                    │
│    }                                                  │
│                                                      │
│  GET  /feedback/summary                               │
│    → aggregated preference patterns for user          │
│                                                      │
│  GET  /feedback/history?step=&rating=                  │
│    → paginated feedback log                           │
└─────────────────────────────────────────────────────┘
```

**How feedback improves generation:**

```
Feedback Loop:
                                    ┌──────────────┐
     ┌─────────┐    generate        │              │
     │ User    │ ──────────────────►│  LLM API     │
     │ Input   │                    │              │
     └─────────┘                    └──────┬───────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │  Generated   │
                                    │  Content     │
                                    └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │  User Swipe  │
                                    │  👍 / 👎     │
                                    └──────┬───────┘
                                           │
                              ┌────────────┴────────────┐
                              ▼                         ▼
                       ┌─────────────┐          ┌─────────────┐
                       │  Feedback   │          │  Examples   │
                       │  Store      │          │  Store      │
                       │ (patterns)  │          │ (if posted) │
                       └──────┬──────┘          └──────┬──────┘
                              │                        │
                              └────────┬───────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Prompt Builder   │
                              │ (next request    │
                              │  includes these) │
                              └─────────────────┘
```

The system does NOT fine-tune the LLM. Instead it uses **retrieval-augmented prompting**:
1. Query feedback store for patterns ("user prefers casual hooks", "user rejects corporate jargon")
2. Query examples store for top-rated published content
3. Inject both into the system prompt as few-shot examples and style constraints

### 2.5 Examples Store (Published Content)

Separate from feedback. When a user approves content for posting, it becomes a **canonical example** of what good output looks like for that user.

```
┌─────────────────────────────────────────────────────┐
│          Examples Service                            │
│                                                      │
│  POST /examples                                      │
│    body: { contentId, platform, text, imageUrl? }    │
│    → automatically created when user publishes       │
│                                                      │
│  GET  /examples?platform=&limit=                     │
│    → retrieve best examples for prompt injection     │
│                                                      │
│  DELETE /examples/:id                                │
│    → user can remove a bad example                   │
└─────────────────────────────────────────────────────┘
```

### 2.6 Social Publishing Service

Handles the actual posting to connected platforms.

```
┌─────────────────────────────────────────────────────┐
│        Social Publishing Service                     │
│                                                      │
│  POST /publish                                       │
│    body: { adaptationId, platforms[], scheduledAt? }  │
│    → posts to selected platforms                     │
│    → stores result as example on success             │
│                                                      │
│  GET  /publish/history                               │
│    → past publications with engagement stats         │
│                                                      │
│  POST /publish/schedule                              │
│    body: { adaptationId, platforms[], dateTime }      │
│    → queue for future posting                        │
└─────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### 3.1 Entity Relationship Overview

```
┌──────────┐       ┌───────────────┐       ┌──────────────┐
│  User    │──1:N──│ SocialAccount │       │ BrandProfile │
│          │──1:1──│               │       │              │
│          │──1:1──┤               │       └──────────────┘
│          │       └───────────────┘              ▲
│          │──1:1─────────────────────────────────┘
│          │
│          │──1:N──┌───────────────┐
│          │       │ContentSession │──1:N──┌──────────────┐
│          │       │               │       │ GeneratedItem│
│          │       └───────────────┘       │ (idea/draft/ │
│          │                               │  adaptation/ │
│          │                               │  image)      │
│          │                               └──────┬───────┘
│          │                                      │
│          │──1:N──┌───────────────┐              │
│          │       │ Feedback      │──────────────┘
│          │       └───────────────┘
│          │
│          │──1:N──┌───────────────┐
│          │       │ Example       │
│          │       │ (published)   │
│          │       └───────────────┘
└──────────┘
```

### 3.2 Key Tables

```sql
-- Core user identity and auth
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Brand and tone context for LLM prompts
CREATE TABLE brand_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    job_title       VARCHAR(200),
    industry        VARCHAR(200),
    tone_of_voice   JSONB,          -- e.g. ["professional", "witty", "approachable"]
    brand_guidelines TEXT,           -- free-form or structured
    target_audience TEXT,
    content_themes  JSONB,          -- preferred topics
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- OAuth tokens for social platforms (encrypted)
CREATE TABLE social_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    platform        VARCHAR(50) NOT NULL,   -- 'twitter', 'instagram', 'linkedin', etc.
    platform_user_id VARCHAR(255),
    access_token    BYTEA NOT NULL,         -- AES-256 encrypted
    refresh_token   BYTEA,                  -- AES-256 encrypted
    token_expires_at TIMESTAMPTZ,
    scopes          VARCHAR(500),
    connected_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, platform)
);

-- A content creation session (one user input → multiple outputs)
CREATE TABLE content_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    input_paragraph TEXT NOT NULL,
    target_platforms JSONB,          -- ["twitter", "instagram", "linkedin"]
    status          VARCHAR(20) DEFAULT 'ideation',
                    -- ideation → drafting → adapting → imaging → ready → published
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Every generated artifact across pipeline steps
CREATE TABLE generated_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES content_sessions(id) ON DELETE CASCADE,
    step            VARCHAR(20) NOT NULL,   -- 'idea', 'draft', 'adaptation', 'image'
    platform        VARCHAR(50),            -- null for ideas/drafts, set for adaptations/images
    content         TEXT,                   -- the generated text
    image_url       VARCHAR(500),           -- for image items
    llm_prompt_hash VARCHAR(64),            -- SHA-256 of the prompt used (for traceability)
    metadata        JSONB,                  -- platform-specific metadata
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Swipe feedback (append-only)
CREATE TABLE feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id         UUID REFERENCES generated_items(id) ON DELETE CASCADE,
    rating          VARCHAR(10) NOT NULL,   -- 'approve' or 'reject'
    note            TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Published content saved as canonical examples
CREATE TABLE examples (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id         UUID REFERENCES generated_items(id),
    platform        VARCHAR(50) NOT NULL,
    content_text    TEXT,
    image_url       VARCHAR(500),
    engagement_data JSONB,          -- likes, shares, etc. (pulled later)
    published_at    TIMESTAMPTZ DEFAULT now()
);

-- Platform-specific user preferences learned over time
CREATE TABLE user_platform_prefs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    platform        VARCHAR(50) NOT NULL,
    pref_key        VARCHAR(100) NOT NULL,  -- e.g. 'hashtag_style', 'hook_type', 'emoji_usage'
    pref_value      JSONB,
    confidence      FLOAT DEFAULT 0.0,      -- 0-1, increases with more feedback
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, platform, pref_key)
);
```

---

## 4. LLM Integration Strategy

### 4.1 Prompt Architecture

Rather than fine-tuning, the system uses **dynamic prompt assembly** that gets better per-user over time:

```
┌─────────────────────────────────────────────┐
│           Prompt Assembly                    │
│                                              │
│  1. SYSTEM CONTEXT                           │
│     "You are a social media content          │
│      strategist for {user.industry}..."      │
│                                              │
│  2. BRAND CONTEXT                            │
│     - Tone: {brand_profile.tone_of_voice}    │
│     - Audience: {brand_profile.target_aud}   │
│     - Guidelines: {brand_profile.guidelines} │
│                                              │
│  3. PLATFORM RULES                           │
│     - Character limits                       │
│     - Best practices                         │
│     - Format requirements                    │
│                                              │
│  4. LEARNED PREFERENCES                      │
│     - From feedback: "User prefers X over Y" │
│     - From prefs table: derived patterns     │
│                                              │
│  5. FEW-SHOT EXAMPLES                        │
│     - Top 3-5 published examples for this    │
│       platform (from examples store)         │
│     - Labeled: "The user approved these"     │
│                                              │
│  6. NEGATIVE EXAMPLES                        │
│     - Top 3 rejected items                   │
│     - Labeled: "Avoid content like this"     │
│                                              │
│  7. USER INPUT                               │
│     - The paragraph they wrote               │
│                                              │
└─────────────────────────────────────────────┘
```

### 4.2 Preference Learning (No Fine-Tuning)

The system extracts patterns from feedback without model training:

1. **Immediate:** Approved/rejected items directly used as few-shot examples
2. **Periodic (batch job):** Analyze feedback corpus with LLM to extract preference summaries:
   - "This user prefers questions as hooks over statements"
   - "This user avoids exclamation marks"
   - "This user likes data-driven openings"
3. **Store** these as `user_platform_prefs` rows with a confidence score
4. **Inject** high-confidence preferences into prompts as explicit instructions

### 4.3 Image Generation

- Use an image generation API (DALL-E, Stability AI, etc.)
- Prompt constructed from: content summary + brand colors/style + platform dimensions
- Store image style preferences in feedback just like text preferences

---

## 5. Tech Stack Recommendation

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js (React) | SSR, good DX, easy auth integration |
| **API** | Node.js + Express or Fastify | Fast, JS ecosystem, good for async LLM calls |
| **Database** | PostgreSQL | JSONB for flexible schema, proven reliability |
| **Auth** | JWT + bcrypt (or Auth0/Clerk for speed) | Standard, stateless API auth |
| **Token Vault** | PostgreSQL with column encryption (or AWS Secrets Manager at scale) | Social tokens must be encrypted at rest |
| **LLM** | Claude API (Anthropic) | Strong instruction-following, good at style adaptation |
| **Image Gen** | DALL-E 3 or Stability AI | High quality, API-accessible |
| **Queue** | BullMQ (Redis-backed) | For async image gen and scheduled publishing |
| **Object Storage** | S3 / Cloudflare R2 | Generated images |
| **Hosting** | Vercel (frontend) + Railway/Render (API) | Simple deployment, auto-scaling |

---

## 6. User Flow

```
1. ONBOARDING
   ┌──────────────────────────────────────────────────┐
   │ Sign up → Fill profile → Set brand guidelines →  │
   │ Describe tone of voice → Connect social accounts  │
   └──────────────────────────────────────────────────┘

2. CONTENT CREATION SESSION
   ┌──────────────────────────────────────────────────────────┐
   │                                                          │
   │  User writes paragraph describing what they want         │
   │  ──────────────────────────────────────────────────       │
   │  "I want to talk about how remote teams can do           │
   │   better async standups without more meetings"           │
   │                                                          │
   │           │                                              │
   │           ▼                                              │
   │  ┌─── IDEATION ───────────────────────┐                  │
   │  │  💡 5 topic angles generated       │                  │
   │  │  ← swipe left  │  swipe right →   │                  │
   │  │  [reject]       │  [approve]       │                  │
   │  └────────────────────────────────────┘                  │
   │           │                                              │
   │           ▼  (approved topics)                           │
   │  ┌─── DRAFTING ───────────────────────┐                  │
   │  │  📝 Full content draft             │                  │
   │  │  [edit] [regenerate] [approve]     │                  │
   │  └────────────────────────────────────┘                  │
   │           │                                              │
   │           ▼                                              │
   │  ┌─── PLATFORM ADAPTATION ────────────┐                  │
   │  │  🐦 Twitter thread version         │ ← swipe →       │
   │  │  💼 LinkedIn post version          │ ← swipe →       │
   │  │  📸 Instagram caption + prompt     │ ← swipe →       │
   │  └────────────────────────────────────┘                  │
   │           │                                              │
   │           ▼  (platforms needing images)                  │
   │  ┌─── IMAGE GENERATION ───────────────┐                  │
   │  │  🖼️ 3 image options per platform   │ ← swipe →       │
   │  └────────────────────────────────────┘                  │
   │           │                                              │
   │           ▼                                              │
   │  ┌─── PUBLISH ────────────────────────┐                  │
   │  │  [Post Now] [Schedule] [Save Draft]│                  │
   │  │  → Published content → Examples DB │                  │
   │  └────────────────────────────────────┘                  │
   │                                                          │
   └──────────────────────────────────────────────────────────┘
```

---

## 7. Inline Editing & Last-Mile Review

Users often want to tweak a word or sentence right before publishing — especially on mobile while multitasking. The system needs to make this fast and frictionless without requiring the user to re-enter a full editing workflow.

### 7.1 Design Principles

1. **Tap-to-edit, not rewrite** — The user sees the final content as rendered text, not a form. Tapping any sentence makes just that sentence editable inline.
2. **Edits are the canonical version** — The user's tweaked text becomes the final published version and the stored example. The AI-generated original is kept as a prior version for diff/learning purposes.
3. **Minimal interaction on mobile** — One-thumb friendly. No modal dialogs, no page transitions.

### 7.2 UX Pattern: Inline Touch Editing

```
┌──────────────────────────────────────────────────┐
│  FINAL REVIEW (before publish)                   │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ Remote teams don't need more meetings —    │  │
│  │ they need better async rituals. Here's     │  │
│  │ how three companies replaced their daily   │  │
│  │ standup with a 2-minute Loom update.       │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Tap any sentence to edit it                     │
│                                                  │
│        [Approve & Post]   [Back]                 │
└──────────────────────────────────────────────────┘

         User taps "2-minute Loom update"
                     │
                     ▼

┌──────────────────────────────────────────────────┐
│  FINAL REVIEW                                    │
│                                                  │
│  Remote teams don't need more meetings —         │
│  they need better async rituals. Here's          │
│  how three companies replaced their daily        │
│  standup with a ┌──────────────────────────┐     │
│                 │ 90-second video check-in │     │
│                 │            [Done] [Undo] │     │
│                 └──────────────────────────┘     │
│                                                  │
│        [Approve & Post]   [Back]                 │
└──────────────────────────────────────────────────┘
```

**Key interactions:**
- **Tap a word or phrase** → highlights the containing sentence, opens inline editor
- **Type replacement** → only that phrase changes, surrounding text stays locked
- **[Done]** → saves edit, collapses editor, shows updated text with a subtle highlight on changed words
- **[Undo]** → reverts to AI-generated version for that sentence
- **Swipe down on editor** → dismiss without saving (mobile gesture)

### 7.3 Smart Assist During Edits

When the user makes an inline edit, the system can optionally offer quick AI suggestions:

```
┌──────────────────────────────────────────────────┐
│  User changed: "2-minute Loom update"            │
│            to: "90-second video check-in"        │
│                                                  │
│  ┌─ Quick suggestions ─────────────────────────┐ │
│  │ "90-second async check-in"                  │ │
│  │ "quick video standup"                       │ │
│  │                          [Use mine instead] │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

- Suggestions appear below the edit field, non-blocking
- User can tap a suggestion to use it, or tap "Use mine instead" to keep their edit
- This is optional and can be toggled off in settings for users who find it noisy

### 7.4 Voice-to-Edit (Mobile Convenience)

For users who are driving or hands-busy:

```
User holds microphone button and says:
"Change 2-minute Loom update to 90-second video check-in"

System:
1. Parses intent: find "2-minute Loom update", replace with "90-second video check-in"
2. Shows the diff for confirmation
3. User taps [Accept] or says "yes"
```

This uses the same natural language → edit mapping that the LLM is good at. The system sends the full post text + voice transcript to the LLM and asks it to return the edited version with a diff.

### 7.5 Data Model Impact

Edits create a version chain, not a replacement:

```sql
CREATE TABLE content_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id         UUID REFERENCES generated_items(id) ON DELETE CASCADE,
    version_number  INT NOT NULL DEFAULT 1,
    content         TEXT NOT NULL,
    edit_type       VARCHAR(20),    -- 'ai_generated', 'user_edited', 'voice_edited'
    diff_from_prev  JSONB,          -- structured diff: [{ position, old, new }]
    is_final        BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

**What gets stored as the example:** The `is_final = true` version (the one actually published).

**What feeds the learning loop:** The diff between AI-generated and user-edited versions. Over time, the system can detect patterns like:
- "User always softens superlatives" → stop generating them
- "User replaces brand jargon with plain language" → adjust tone
- "User shortens sentences on Twitter but not LinkedIn" → platform-specific length preference

### 7.6 Review Screen Modes

The final review screen supports three modes depending on context:

| Mode | When | Behavior |
|---|---|---|
| **Quick glance** | User swiped right on everything | Shows all platform posts in a scrollable stack. Tap [Post All] or tap any post to edit. |
| **Individual review** | Default | Card-per-platform, swipe through each. Tap to inline edit. |
| **Batch edit** | User taps "Edit all" | Full editor view with all platforms visible, tab between them. |

### 7.7 Edit-Aware Feedback

When the user edits content before publishing, this generates **implicit feedback** that's more valuable than a simple swipe:

```
┌─────────────────────────────────────────────────┐
│ Signal              │ What it tells us           │
├─────────────────────┼────────────────────────────┤
│ No edits + publish  │ Strong positive signal     │
│ Minor word swap     │ Mostly good, tone tweak    │
│ Sentence rewrite    │ Right direction, wrong      │
│                     │ execution                   │
│ Paragraph rewrite   │ Topic OK, voice is off     │
│ Delete + regenerate │ Strong negative signal     │
└─────────────────────────────────────────────────┘
```

The system automatically logs edit distances and uses them to weight feedback — a post published with zero edits is a stronger positive signal than one that needed heavy revision.

---

## 8. API Summary

| Method | Endpoint | Service | Description |
|---|---|---|---|
| POST | `/auth/register` | Auth | Create account |
| POST | `/auth/login` | Auth | Login, get JWT |
| POST | `/auth/refresh` | Auth | Refresh JWT |
| GET | `/auth/social/:platform/connect` | Auth | Start OAuth flow |
| GET | `/auth/social/:platform/callback` | Auth | Complete OAuth |
| GET | `/users/me` | Profile | Get user profile |
| PATCH | `/users/me` | Profile | Update profile |
| PUT | `/users/me/brand-guidelines` | Profile | Update brand |
| PUT | `/users/me/tone-of-voice` | Profile | Update tone |
| POST | `/content/ideate` | Content | Generate topic ideas |
| POST | `/content/draft` | Content | Generate full draft |
| POST | `/content/adapt` | Content | Platform adaptations |
| POST | `/content/generate-images` | Content | Generate images |
| POST | `/content/regenerate` | Content | Regenerate any step |
| POST | `/feedback` | Feedback | Submit swipe rating |
| GET | `/feedback/summary` | Feedback | Preference patterns |
| GET | `/examples` | Examples | Get published examples |
| POST | `/publish` | Publishing | Post to platforms |
| POST | `/publish/schedule` | Publishing | Schedule a post |

---

## 9. Security Considerations

1. **Social tokens:** AES-256 encrypted at rest, never returned in API responses, decrypted only at publish time
2. **User auth:** bcrypt password hashing, short-lived JWTs, refresh token rotation
3. **API:** Rate limiting per user, input validation, CORS restricted to frontend domain
4. **LLM prompts:** User input sanitized before injection into prompts (prevent prompt injection)
5. **Data isolation:** All queries scoped by `user_id`, row-level security in Postgres

---

## 10. Scaling Considerations

**Phase 1 (MVP — single-digit users):**
- Monolith API (all services in one Node.js app)
- Single Postgres instance
- Synchronous LLM calls
- No queue needed

**Phase 2 (tens of users):**
- Add Redis + BullMQ for async image generation and scheduled posts
- Connection pooling for Postgres
- Cache frequently accessed user profiles

**Phase 3 (hundreds+ users):**
- Extract services if needed (content gen is the hot path)
- Read replicas for Postgres
- CDN for generated images
- Consider vector DB for semantic search over examples/feedback

---

## 11. Future Considerations

- **Role-based templates:** Pre-built brand profiles for common roles (e.g., "SaaS Founder", "Real Estate Agent") as starting points
- **Analytics dashboard:** Pull engagement data from platforms back into the system to close the feedback loop with real performance data
- **Team/org accounts:** Multiple users sharing brand guidelines but with individual tone preferences
- **Content calendar:** Visual scheduling across platforms
- **A/B testing:** Post two variants and track which performs better, feeding results back into preferences
- **Vector embeddings:** Embed all examples and feedback for semantic retrieval instead of keyword-based lookup
