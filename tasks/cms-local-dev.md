# Running Sveltia CMS Locally (before OAuth is set up)

Sveltia CMS is configured to use the `github` backend. Until the GitHub OAuth proxy is set up (separate task), you can test it locally using the Sveltia proxy server, which lets you edit files directly in the repo without any login.

## Steps

1. In one terminal, run the Eleventy dev server:
   ```
   npm run dev
   ```

2. In another terminal, run the Sveltia local proxy from the repo root:
   ```
   npx @sveltia/cms-proxy-server
   ```
   The proxy runs on port 8081 by default. Sveltia CMS auto-detects it when you're on localhost.

3. Open http://localhost:8080/cms/ — Sveltia will detect the local proxy and bypass GitHub auth, letting you edit files directly.

4. Changes save directly to `src/events/` and `src/press/` as markdown files. Commit and push as normal.

## Notes

- The local proxy bypasses the `editorial_workflow` setting — saves go directly to disk, not through a PR. That's expected for local dev.
- Editorial workflow (drafts → PRs) only applies when using the live GitHub backend in production.
- When the OAuth proxy is configured, visiting `https://thewanderinglantern.com/cms/` will prompt for GitHub login and use the real PR workflow.
- Do NOT run `npx @sveltia/cms-proxy-server` on a production server — it's for local development only.
