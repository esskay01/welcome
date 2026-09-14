// Cloudflare Pages Function: /api/wishes
// Requires a KV namespace bound as WISHES_KV in your Pages project settings
// (Settings → Functions → KV namespace bindings → variable name: WISHES_KV).

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

export async function onRequestGet({ env }) {
  const list = await env.WISHES_KV.list({ prefix: "wish:", limit: MAX_RETURNED });
  const values = await Promise.all(
    list.keys.map((k) => env.WISHES_KV.get(k.name, "json"))
  );
  const wishes = values
    .filter(Boolean)
    .sort((a, b) => b.ts - a.ts);

  return new Response(JSON.stringify({ wishes }), {
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const name = (body.name || "").toString().trim().slice(0, MAX_NAME_LEN);
  const message = (body.message || "").toString().trim().slice(0, MAX_MESSAGE_LEN);

  if (!name || !message) {
    return new Response(JSON.stringify({ error: "Name and message are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const wish = {
    name: escapeHtml(name),
    message: escapeHtml(message),
    ts: Date.now(),
  };

  const key = `wish:${wish.ts}-${crypto.randomUUID()}`;
  await env.WISHES_KV.put(key, JSON.stringify(wish));

  return new Response(JSON.stringify({ ok: true, wish }), {
    headers: { "content-type": "application/json" },
  });
}
