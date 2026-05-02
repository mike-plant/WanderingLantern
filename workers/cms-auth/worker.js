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
