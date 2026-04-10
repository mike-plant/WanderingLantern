# Task C: GitHub OAuth Proxy for Sveltia CMS

## Context

This is a static Eleventy site for The Wandering Lantern children's bookstore. The site is hosted on GitHub Pages with a **custom domain: `thewanderinglantern.com`** (set via the `CNAME` file at the repo root). Sveltia CMS is installed at `/cms/` (see Task A) and configured to use the `github` backend in `src/cms/config.yml`. The schema has been expanded with price, location, host, registrationUrl, and draft fields (see Task B).

**⚠️ Important:** The primary CMS URL is `https://thewanderinglantern.com/cms/`, NOT `mike-plant.github.io/WanderingLantern/cms/`. Use the custom domain everywhere in this task.

**The missing piece:** The `github` backend requires an OAuth flow to authenticate users (the store owner Emily, and the developer Michael). That OAuth flow needs a tiny server-side component called an "OAuth proxy" — a small HTTP service that exchanges GitHub's auth code for an access token and hands it back to the CMS.

**Goal:** Deploy a GitHub OAuth proxy as a Cloudflare Worker so Emily can log into `/cms/` with her GitHub account and publish events directly from the web.

## Why Cloudflare Workers

- **Free tier is generous** (100K requests/day, more than enough for a CMS)
- **Single-file deploy** — one JavaScript file, no build step
- **No cold starts** — instant response, better UX than Lambda/Vercel for infrequent use
- **No account needed beyond Cloudflare** — Michael can sign up free if he doesn't have one

Alternatives like Vercel, Netlify Functions, or self-hosted Express servers would also work, but Cloudflare Workers is the simplest.

## Deliverables

1. A Cloudflare Worker script checked into the repo at `workers/cms-auth/worker.js`
2. Deployment configuration at `workers/cms-auth/wrangler.toml`
3. A step-by-step setup guide at `workers/cms-auth/README.md` with:
   - How to create a GitHub OAuth App
   - How to deploy the Worker (via wrangler CLI or Cloudflare dashboard)
   - How to set the secrets (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`)
   - How to verify it works
4. Updated `src/cms/config.yml` with the `base_url` pointing to the deployed Worker
5. A section in `CLAUDE.md` documenting that the OAuth proxy exists and how it fits into the architecture

## Implementation

### 1. Create the Worker script

**File:** `workers/cms-auth/worker.js`

This worker implements the Decap/Sveltia CMS OAuth flow. It has two routes:
- `GET /auth` — redirects to GitHub's OAuth authorization page
- `GET /callback` — receives GitHub's auth code, exchanges it for an access token, and posts the token back to the CMS window via `window.opener.postMessage`

Use this implementation:

```js
// workers/cms-auth/worker.js
// GitHub OAuth proxy for Sveltia CMS / Decap CMS
// Deployed as a Cloudflare Worker

const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

// Who is allowed to use this proxy? Must match the Sveltia CMS origin(s).
// Add any additional origins (staging, local dev) to this list.
const ALLOWED_ORIGINS = [
  "https://thewanderinglantern.com",
  "https://www.thewanderinglantern.com",
  "https://mike-plant.github.io", // Fallback — GitHub Pages default URL
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route: /auth — start the OAuth flow
    if (url.pathname === "/auth" || url.pathname === "/") {
      const scope = url.searchParams.get("scope") || "repo,user";
      const redirectUrl = new URL(GITHUB_OAUTH_URL);
      redirectUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      redirectUrl.searchParams.set("scope", scope);
      redirectUrl.searchParams.set(
        "redirect_uri",
        `${url.origin}/callback`
      );
      return Response.redirect(redirectUrl.toString(), 302);
    }

    // Route: /callback — GitHub sends the user back here with a ?code=
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response("Missing ?code parameter", { status: 400 });
      }

      // Exchange the code for an access token
      const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error || !tokenData.access_token) {
        return htmlResponse(
          buildMessagePage("error", tokenData.error || "Unknown error")
        );
      }

      const payload = {
        token: tokenData.access_token,
        provider: "github",
      };

      return htmlResponse(buildMessagePage("success", payload));
    }

    return new Response("Not found", { status: 404 });
  },
};

function htmlResponse(html) {
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// The CMS opens the OAuth flow in a popup window and listens for a
// postMessage from the popup in this exact format:
//   "authorization:github:success:{token,provider}"
// or
//   "authorization:github:error:<message>"
function buildMessagePage(state, content) {
  const message =
    state === "success"
      ? `authorization:github:success:${JSON.stringify(content)}`
      : `authorization:github:error:${content}`;

  const allowedOriginsJson = JSON.stringify(ALLOWED_ORIGINS);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authorizing…</title>
</head>
<body>
  <p>Authorizing… you can close this window.</p>
  <script>
    (function() {
      var message = ${JSON.stringify(message)};
      var allowedOrigins = ${allowedOriginsJson};

      function sendMessage(e) {
        if (allowedOrigins.indexOf(e.origin) === -1) return;
        window.opener.postMessage(message, e.origin);
        window.removeEventListener("message", sendMessage, false);
      }

      window.addEventListener("message", sendMessage, false);
      if (window.opener) {
        window.opener.postMessage("authorizing:github", "*");
      }
    })();
  </script>
</body>
</html>`;
}
```

### 2. Create the wrangler config

**File:** `workers/cms-auth/wrangler.toml`

```toml
name = "wl-cms-auth"
main = "worker.js"
compatibility_date = "2024-11-01"

# Secrets (set via: wrangler secret put GITHUB_CLIENT_ID)
# Do NOT commit these values:
#   GITHUB_CLIENT_ID
#   GITHUB_CLIENT_SECRET
```

### 3. Write the README / setup guide

**File:** `workers/cms-auth/README.md`

This is the most important deliverable — Michael will follow it once to set everything up. Write clear, numbered steps. Structure:

```markdown
# CMS Auth Worker — Setup Guide

This Cloudflare Worker is the GitHub OAuth proxy for Sveltia CMS on
the Wandering Lantern website. Follow these steps once to deploy it.

## Prerequisites

- A Cloudflare account (free tier is fine): https://dash.cloudflare.com/sign-up
- The `wrangler` CLI installed: `npm install -g wrangler`
- Ownership of the `mike-plant/WanderingLantern` GitHub repo

## Step 1: Create a GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name:** Wandering Lantern CMS
   - **Homepage URL:** https://mike-plant.github.io/WanderingLantern/
   - **Authorization callback URL:** https://wl-cms-auth.<your-cf-subdomain>.workers.dev/callback
     (⚠️ You'll get the real URL after Step 3. For now, put a placeholder
     and update it after deploying.)
4. Click **"Register application"**
5. On the next page, copy the **Client ID** (visible) and click
   **"Generate a new client secret"** to get the **Client Secret**
6. Save both values somewhere safe — you'll need them in Step 4

## Step 2: Authenticate wrangler with Cloudflare

```bash
wrangler login
```

This opens a browser window. Approve the Cloudflare OAuth prompt.

## Step 3: Deploy the Worker

From the repo root:

```bash
cd workers/cms-auth
wrangler deploy
```

On first deploy, wrangler will assign a URL like:
`https://wl-cms-auth.<your-subdomain>.workers.dev`

Copy this URL — you need it for Step 4.

## Step 4: Set the secrets

Run these two commands (you'll be prompted to paste each value):

```bash
wrangler secret put GITHUB_CLIENT_ID
# Paste the Client ID from Step 1

wrangler secret put GITHUB_CLIENT_SECRET
# Paste the Client Secret from Step 1
```

## Step 5: Update the GitHub OAuth App callback URL

1. Go back to https://github.com/settings/developers
2. Click your "Wandering Lantern CMS" app
3. Update the **Authorization callback URL** to the real Worker URL
   from Step 3, with `/callback` appended:
   `https://wl-cms-auth.<your-subdomain>.workers.dev/callback`
4. Click **"Update application"**

## Step 6: Update the CMS config

Edit `src/cms/config.yml` in the repo. Change the `backend` section to:

```yaml
backend:
  name: github
  repo: mike-plant/WanderingLantern
  branch: main
  base_url: https://wl-cms-auth.<your-subdomain>.workers.dev
```

(Replace `<your-subdomain>` with your actual Cloudflare subdomain.)

Commit and push. GitHub Actions will deploy the updated CMS.

## Step 7: Test the login

1. Visit https://mike-plant.github.io/WanderingLantern/cms/
2. Click "Login with GitHub"
3. Authorize the OAuth app on GitHub
4. You should be redirected back to the CMS, now logged in

## Troubleshooting

**"Redirect URI mismatch" error:**
The callback URL in the GitHub OAuth App (Step 5) must match the Worker
URL exactly, including `/callback` at the end.

**Popup closes but CMS doesn't log in:**
Check the browser console for postMessage errors. The `ALLOWED_ORIGINS`
array in `worker.js` must include your site's origin.

**Worker responds with 500:**
Run `wrangler tail` to see live logs, then try logging in again.

**Need to add another user:**
Add them as a collaborator on the repo (github.com/mike-plant/WanderingLantern/settings/access).
Any GitHub user with push access to the repo can log into the CMS.

## Updating the Worker Later

If you change `worker.js`:

```bash
cd workers/cms-auth
wrangler deploy
```

The secrets persist across deploys. You don't need to re-run
`wrangler secret put` unless you want to rotate them.
```

### 4. Update `src/cms/config.yml`

Currently the backend section looks like:

```yaml
backend:
  name: github
  repo: mike-plant/WanderingLantern
  branch: main
  # OAuth proxy will be added in a later task...
```

Update the comment to reference the new Worker and note that the `base_url` needs to be filled in after deployment:

```yaml
backend:
  name: github
  repo: mike-plant/WanderingLantern
  branch: main
  # base_url is set to the deployed Cloudflare Worker auth proxy.
  # Setup instructions: workers/cms-auth/README.md
  # base_url: https://wl-cms-auth.<subdomain>.workers.dev
```

**Do NOT commit a real base_url** — leave it commented out. Michael will uncomment and fill it in after running Step 3 of the README.

### 5. Update `CLAUDE.md`

Add a short section under the architecture notes (look for an existing "Deployment" or "Architecture" section) explaining:

- The CMS at `/cms/` uses a Cloudflare Worker for GitHub OAuth
- Worker code lives in `workers/cms-auth/`
- Setup is one-time per Cloudflare account — see `workers/cms-auth/README.md`
- Secrets (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) are stored in the Worker environment, not the repo

### 6. Verify

- [ ] `npm run build` still succeeds
- [ ] `workers/cms-auth/worker.js` exists and is syntactically valid JavaScript
- [ ] `workers/cms-auth/wrangler.toml` exists
- [ ] `workers/cms-auth/README.md` exists with all 7 steps
- [ ] `src/cms/config.yml` has updated comments but no real `base_url` yet
- [ ] `CLAUDE.md` has a reference to the auth worker

## Acceptance Criteria

- [ ] All files above created
- [ ] Worker script is self-contained, no npm dependencies
- [ ] README is clear enough that Michael can follow it without asking questions
- [ ] No secrets or credentials in the repo
- [ ] No changes to other parts of the site

## Notes for the agent

- **Do not run `wrangler deploy` yourself.** That requires Michael's Cloudflare account. Your job is to write the code and documentation; Michael executes the deploy.
- **Do not add any npm dependencies.** Wrangler should be installed globally by Michael.
- **Do not put any secrets in the repo.** Client ID and Client Secret go in Worker secrets only.
- **Do not rename `ALLOWED_ORIGINS` entries** without checking — the GitHub Pages URL is `https://mike-plant.github.io` (organization-level) with the repo path `/WanderingLantern/` appended. The allowed origin is just the host part, not the path.
- **The `postMessage` protocol is exact.** The message format `authorization:github:success:<json>` is required by Decap/Sveltia — don't "improve" it.
- **Test the worker.js syntax** by running `node --check workers/cms-auth/worker.js` before declaring done.
