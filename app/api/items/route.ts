import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { timingSafeEqual } from "crypto";
import { createItem, listItems, type FileRef, type ItemInput } from "@/lib/db";
import { addDays, isValidDate, todayIL } from "@/lib/dates";
import { platformOf } from "@/lib/constants";
import { esc, notify } from "@/lib/telegram";

// API for content Claude (or any of your tools) prepares for you.
// Auth: header "Authorization: Bearer <STUDIO_API_KEY>".
function authorized(req: Request) {
  const key = process.env.STUDIO_API_KEY;
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!key || key.length < 24 || !got) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

type InImage = { name?: string; type?: string; base64?: string };
type InItem = ItemInput & { images?: InImage[] };

async function storeImages(images: InImage[] | undefined): Promise<FileRef[]> {
  const out: FileRef[] = [];
  for (const img of images ?? []) {
    if (!img?.base64) continue;
    const data = Buffer.from(img.base64.replace(/^data:[^,]+,/, ""), "base64");
    const name = (img.name || "image.png").replace(/[^\w.\-]/g, "_");
    const blob = await put(`claude/${name}`, data, {
      access: "public",
      addRandomSuffix: true,
      contentType: img.type || "image/png",
    });
    out.push({ url: blob.url, downloadUrl: blob.downloadUrl, name, type: img.type || "image/png", size: data.length });
  }
  return out;
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: InItem | InItem[] | { items: InItem[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const list: InItem[] = Array.isArray(body) ? body : "items" in body && Array.isArray(body.items) ? body.items : [body as InItem];
  if (!list.length || list.length > 30) return NextResponse.json({ error: "send 1-30 items" }, { status: 400 });

  const created = [];
  for (const raw of list) {
    const files = [...(Array.isArray(raw.files) ? raw.files : []), ...(await storeImages(raw.images))];
    const item = await createItem({
      ...raw,
      files,
      date: isValidDate(raw.date) ? raw.date : todayIL(),
      status: raw.status ?? "ready",
      source: raw.source ?? "claude",
    });
    created.push(item);
  }

  const lines = created.map((i) => `${platformOf(i.platform).emoji} ${esc(i.title || i.kind || "פריט")} · ${i.date}${i.time ? " " + i.time : ""}`);
  await notify(
    `🆕 <b>${created.length === 1 ? "פריט חדש מוכן בלוח" : `${created.length} פריטים חדשים בלוח`}</b>\n${lines.join("\n")}`,
    created.length === 1 ? `/item/${created[0].id}` : `/calendar?d=${created[0].date}`
  );

  return NextResponse.json({ ok: true, items: created.map((i) => ({ id: i.id, date: i.date, status: i.status })) });
}

// Quick read access for tools: GET /api/items?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const u = new URL(req.url);
  const from = isValidDate(u.searchParams.get("from")) ? u.searchParams.get("from")! : todayIL();
  const to = isValidDate(u.searchParams.get("to")) ? u.searchParams.get("to")! : addDays(from, 6);
  return NextResponse.json({ items: await listItems(from, to) });
}
