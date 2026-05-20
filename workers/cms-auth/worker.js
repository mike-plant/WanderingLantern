// workers/cms-auth/worker.js
// GitHub OAuth proxy for Sveltia CMS / Decap CMS,
// plus Mailchimp tag management endpoints for the in-CMS tag picker.
// Deployed as a Cloudflare Worker.

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

    // CORS preflight — handled for any API endpoint
    if (request.method === "OPTIONS") {
      return handleCorsPreflight(request);
    }

    // --- Mailchimp tag endpoints (called from CMS browser context) ---
    if (url.pathname === "/list-tags" && request.method === "GET") {
      return handleListTags(request, env);
    }
    if (url.pathname === "/create-tag" && request.method === "POST") {
      return handleCreateTag(request, env);
    }

    // --- GitHub OAuth flow ---

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

// ----- CORS -----

function handleCorsPreflight(request) {
  const origin = request.headers.get("Origin");
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

function jsonResponse(body, origin, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
    },
  });
}

// ----- Mailchimp helpers -----

function mailchimpBaseUrl(env) {
  // API key format: "abc123def-us12" — data center is the suffix
  const dc = env.MAILCHIMP_API_KEY.split("-").pop();
  return `https://${dc}.api.mailchimp.com/3.0`;
}

function mailchimpHeaders(env) {
  const auth = btoa(`anystring:${env.MAILCHIMP_API_KEY}`);
  return {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };
}

async function mailchimpListTags(env) {
  const url = `${mailchimpBaseUrl(env)}/lists/${env.MAILCHIMP_LIST_ID}/segments?type=static&count=1000`;
  const res = await fetch(url, { headers: mailchimpHeaders(env) });
  if (!res.ok) {
    let detail = `Mailchimp error: ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  const data = await res.json();
  return (data.segments || [])
    .map((s) => ({ id: s.id, name: s.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function mailchimpCreateTag(env, name) {
  const url = `${mailchimpBaseUrl(env)}/lists/${env.MAILCHIMP_LIST_ID}/segments`;
  const res = await fetch(url, {
    method: "POST",
    headers: mailchimpHeaders(env),
    body: JSON.stringify({ name, static_segment: [] }),
  });
  if (!res.ok) {
    let detail = `Mailchimp error: ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch (_) {}
    // If a tag with this name already exists, return the existing one
    if (detail.toLowerCase().includes("already exists")) {
      const existing = (await mailchimpListTags(env)).find((t) => t.name === name);
      if (existing) return existing;
    }
    throw new Error(detail);
  }
  const data = await res.json();
  return { id: data.id, name: data.name };
}

// ----- Endpoint handlers -----

async function handleListTags(request, env) {
  const origin = request.headers.get("Origin");
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!env.MAILCHIMP_API_KEY || !env.MAILCHIMP_LIST_ID) {
    return jsonResponse(
      { error: "Mailchimp secrets not configured on the Worker" },
      origin,
      500
    );
  }
  try {
    const tags = await mailchimpListTags(env);
    return jsonResponse(tags, origin);
  } catch (e) {
    return jsonResponse({ error: e.message }, origin, 500);
  }
}

async function handleCreateTag(request, env) {
  const origin = request.headers.get("Origin");
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!env.MAILCHIMP_API_KEY || !env.MAILCHIMP_LIST_ID) {
    return jsonResponse(
      { error: "Mailchimp secrets not configured on the Worker" },
      origin,
      500
    );
  }
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return jsonResponse({ error: "Invalid JSON body" }, origin, 400);
  }
  const name = body && typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return jsonResponse({ error: "Tag name is required" }, origin, 400);
  }
  try {
    const tag = await mailchimpCreateTag(env, name);
    return jsonResponse(tag, origin);
  } catch (e) {
    return jsonResponse({ error: e.message }, origin, 500);
  }
}

// ----- OAuth helpers (unchanged) -----

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
