// Reads inbox/*.json, uploads referenced images, POSTs to /api/items, deletes what was delivered.
// JSON format (one item, or an array, or { "items": [...] }):
// { "title": "...", "platform": "ig_post", "date": "2026-11-02", "time": "19:00",
//   "caption": "...", "hashtags": "#דילוש", "images": ["post.png"] }
// "images" are file names next to the JSON inside inbox/.
import { readFileSync, readdirSync, unlinkSync, existsSync, statSync } from "fs";
import { join, extname } from "path";

const DIR = "inbox";
const base = (process.env.STUDIO_URL || "").replace(/\/$/, "");
const key = process.env.STUDIO_API_KEY;
if (!base || !key) {
  console.error("Missing STUDIO_URL / STUDIO_API_KEY secrets");
  process.exit(1);
}
if (!existsSync(DIR)) process.exit(0);

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };
const MAX = 4 * 1024 * 1024; // Vercel request limit is 4.5MB

let failed = 0;
for (const f of readdirSync(DIR).filter((x) => x.endsWith(".json")).sort()) {
  const path = join(DIR, f);
  try {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    const list = Array.isArray(raw) ? raw : Array.isArray(raw.items) ? raw.items : [raw];
    const used = [];
    for (const item of list) {
      const names = Array.isArray(item.images) ? item.images.filter((n) => typeof n === "string") : [];
      const imgs = [];
      for (const n of names) {
        const p = join(DIR, n);
        if (!existsSync(p)) throw new Error(`missing image ${n}`);
        if (statSync(p).size > MAX) throw new Error(`${n} is larger than 4MB`);
        imgs.push({ name: n, type: MIME[extname(n).toLowerCase()] || "image/png", base64: readFileSync(p).toString("base64") });
        used.push(p);
      }
      item.images = imgs;
      item.source = item.source || "claude";
    }
    for (const item of list) {
      const res = await fetch(`${base}/api/items`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    unlinkSync(path);
    for (const p of used) if (existsSync(p)) unlinkSync(p);
    console.log(`✓ ${f} (${list.length} items)`);
  } catch (e) {
    failed++;
    console.error(`✗ ${f}: ${e.message}`);
  }
}
if (failed) process.exitCode = 1;
