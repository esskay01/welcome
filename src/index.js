// src/index.js
// Handles /api/wishes (GET + POST) against KV.
// Every other request is served from the static files in /public via the
// ASSETS binding — see wrangler.jsonc.

const MAX_NAME_LEN = 60;
const MAX_MESSAGE_LEN = 400;
const MAX_RETURNED = 200;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function handleGetWishes(env) {
  const list = await env.WISHES_KV.list({ prefix: "wish:", limit: MAX_RETURNED });
  const values = await Promise.all(
    list.keys.map((k) => env.WISHES_KV.get(k.name, "json"))
  );
  const wishes = values.filter(Boolean).sort((a, b) => b.ts - a.ts);
  return json({ wishes });
}

async function handlePostWish(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const name = (body.name || "").toString().trim().slice(0, MAX_NAME_LEN);
  const message = (body.message || "").toString().trim().slice(0, MAX_MESSAGE_LEN);

  if (!name || !message) {
    return json({ error: "Name and message are required" }, 400);
  }

  const wish = {
    name: escapeHtml(name),
    message: escapeHtml(message),
    ts: Date.now(),
  };

  const key = `wish:${wish.ts}-${crypto.randomUUID()}`;
  await env.WISHES_KV.put(key, JSON.stringify(wish));

  return json({ ok: true, wish });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/wishes") {
      if (request.method === "GET") return handleGetWishes(env);
      if (request.method === "POST") return handlePostWish(request, env);
      return json({ error: "Method not allowed" }, 405);
    }

    // Fall back to static assets (public/) for everything else
    return env.ASSETS.fetch(request);
  },
};
