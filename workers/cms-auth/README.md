# CMS Auth Worker — Setup Guide

This Cloudflare Worker is the GitHub OAuth proxy for Sveltia CMS on
the Wandering Lantern website. Follow these steps once to deploy it.

## Prerequisites

- A Cloudflare account (free tier is fine): https://dash.cloudflare.com/sign-up
- The `wrangler` CLI installed: `npm install -g wrangler`
- Ownership of the `mike-plant/WanderingLantern` GitHub repo

---

## Step 1: Create a GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name:** `Wandering Lantern CMS`
   - **Homepage URL:** `https://thewanderinglantern.com/`
   - **Authorization callback URL:** `https://wl-cms-auth.<your-cf-subdomain>.workers.dev/callback`
     _(⚠️ You'll get the real URL after Step 3. For now, put a placeholder
     and update it after deploying.)_
4. Click **"Register application"**
5. On the next page, copy the **Client ID** (visible immediately)
6. Click **"Generate a new client secret"** and copy the **Client Secret**
7. Save both values somewhere safe — you'll need them in Step 4

---

## Step 2: Authenticate wrangler with Cloudflare

```bash
wrangler login
```

This opens a browser window. Approve the Cloudflare OAuth prompt.
You only need to do this once per machine.

---

## Step 3: Deploy the Worker

From the repo root:

```bash
cd workers/cms-auth
wrangler deploy
```

On first deploy, wrangler will assign a URL like:
`https://wl-cms-auth.<your-subdomain>.workers.dev`

Copy this URL — you need it for Steps 4 and 5.

---

## Step 4: Set the secrets

Run these two commands. You'll be prompted to paste each value:

```bash
wrangler secret put GITHUB_CLIENT_ID
# Paste the Client ID from Step 1, then press Enter

wrangler secret put GITHUB_CLIENT_SECRET
# Paste the Client Secret from Step 1, then press Enter
```

Secrets are stored encrypted in Cloudflare — they are never in the repo.

---

## Step 5: Update the GitHub OAuth App callback URL

1. Go back to https://github.com/settings/developers
2. Click your **"Wandering Lantern CMS"** app
3. Update **Authorization callback URL** to the real Worker URL from Step 3,
   with `/callback` appended:
   ```
   https://wl-cms-auth.<your-subdomain>.workers.dev/callback
   ```
4. Click **"Update application"**

---

## Step 6: Update the CMS config

Edit `src/cms/config.yml` in the repo. Find the `backend` section and
uncomment + fill in the `base_url` line:

```yaml
backend:
  name: github
  repo: mike-plant/WanderingLantern
  branch: main
  base_url: https://wl-cms-auth.<your-subdomain>.workers.dev
```

Commit and push. GitHub Actions will deploy the updated CMS automatically.

---

## Step 7: Test the login

1. Visit `https://thewanderinglantern.com/cms/`
2. Click **"Login with GitHub"**
3. A popup opens — authorize the OAuth app on GitHub
4. The popup closes and you should be logged into the CMS

---

## Troubleshooting

**"Redirect URI mismatch" error from GitHub**
The callback URL in the GitHub OAuth App (Step 5) must exactly match
the Worker URL, including the `/callback` suffix.

**Popup closes but CMS stays on the login screen**
Open the browser console and look for `postMessage` errors. The
`ALLOWED_ORIGINS` array in `worker.js` must include the origin of the
page running the CMS (e.g. `https://thewanderinglantern.com`).

**Worker responds with a 500 error**
Stream live logs while you try to log in:
```bash
cd workers/cms-auth
wrangler tail
```
Look for the error message in the output.

**"Missing client_id" or blank token error**
The secrets weren't set. Re-run Step 4 while `cd`'d into `workers/cms-auth`.

**Need to give Emily (or another user) CMS access**
Add them as a collaborator on the repo:
`github.com/mike-plant/WanderingLantern` → Settings → Collaborators
Any GitHub user with push access to the repo can log into the CMS.

---

## Updating the Worker Later

If you change `worker.js`, redeploy with:

```bash
cd workers/cms-auth
wrangler deploy
```

Secrets persist across deploys — no need to re-run `wrangler secret put`
unless you want to rotate them.
