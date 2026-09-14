# Baby Welcome Invitation — welcome.sksap.com

## Files
- `index.html` — the invitation page
- `functions/api/wishes.js` — Cloudflare Pages Function that stores and serves the live wishes wall (needs a KV namespace — see step 2 below)

## 1. Fill in the real details
Search `index.html` for anything wrapped as `<span class="placeholder">` or a `value placeholder` div —
these are the bracketed placeholders:
- Baby's name (hero headline)
- Partner's name (hero subtext)
- Date, time, venue name (details row)

Just replace the placeholder text directly in the HTML. The map and "Get directions" button
already point at the coordinates you gave me, so no changes needed there.

## 2. Set up the wishes wall (Cloudflare Pages + KV)
This is the one part that needs a small amount of Cloudflare dashboard setup — the page itself
won't be able to show live wishes to other visitors until this is done.

1. **Create a KV namespace**
   Cloudflare dashboard → **Workers & Pages → KV** → **Create a namespace** → name it `WISHES_KV` (or anything memorable).

2. **Bind it to your Pages project**
   Go to your Pages project → **Settings → Functions → KV namespace bindings** → **Add binding**:
   - Variable name: `WISHES_KV` (must match exactly — this is what `wishes.js` refers to)
   - KV namespace: the one you just created

3. **Deploy** — upload `index.html` and the `functions/` folder together, keeping the folder
   structure exactly as given (`functions/api/wishes.js`). Cloudflare Pages automatically turns
   anything under `functions/` into a live API route — `functions/api/wishes.js` becomes
   `yoursite.com/api/wishes` with no extra config beyond the KV binding above.

4. **Test it** — open the live page, submit a wish, and refresh. It should reappear. Open it in
   a second browser/incognito window to confirm it's visible to other visitors too (not just
   saved locally).

## 3. Set up the subdomain
1. Cloudflare dashboard → your `sksap.com` zone → **DNS** → confirm there's no conflicting
   record already using the subdomain you want (e.g. `welcome`).
2. In your **Pages project → Custom domains → Set up a custom domain**, enter
   `welcome.sksap.com` (or whichever subdomain you chose) — Cloudflare will handle the DNS
   record automatically since the zone is already on your account.
3. Give it a few minutes to propagate, then visit the subdomain to confirm it's live.

## Notes on the wishes wall
- Messages are capped at 400 characters, names at 60 — this is enforced both in the browser and
  in the Function itself, so it can't be bypassed by calling the API directly.
- Input is HTML-escaped before storage, so a wish containing `<script>` or similar will show up
  as plain text rather than executing.
- The page polls for new wishes every 20 seconds, so a wish from another guest shows up
  automatically without needing a refresh.
- There's no moderation/delete UI built in. If you want to remove a specific wish later, you can
  do it from Cloudflare dashboard → Workers & Pages → KV → your namespace → find and delete the
  key (they're named `wish:<timestamp>-<id>`).
