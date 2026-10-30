import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";

// Local development only: point the Neon HTTP driver at a local endpoint.
if (process.env.NODE_ENV !== "production" && process.env.NEON_LOCAL_FETCH_ENDPOINT) {
  neonConfig.fetchEndpoint = process.env.NEON_LOCAL_FETCH_ENDPOINT;
}
import { isValidDate, isValidTime } from "./dates";
import { normalizePlatform, normalizeStatus, type PlatformId, type StatusId } from "./constants";

export type FileRef = { url: string; downloadUrl?: string; name: string; type: string; size?: number };

export type Item = {
  id: number;
  title: string;
  kind: string;
  platform: PlatformId;
  date: string;
  time: string | null;
  status: StatusId;
  caption: string;
  hashtags: string;
  files: FileRef[];
  affiliate_link: string;
  notes: string;
  source: string;
  posted_at: string | null;
  created_at: string;
};

export type TemplateSlot = {
  weekday: number; // 0 = Sunday
  time: string;
  platform: PlatformId;
  kind: string;
  title: string;
};

export type Template = { id: number; name: string; slots: TemplateSlot[]; created_at: string };

let _sql: NeonQueryFunction<false, false> | null = null;
function db() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL חסר. חבר את Neon בפרויקט ב-Vercel.");
    _sql = neon(url);
  }
  return _sql;
}

let schemaReady: Promise<void> | null = null;
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = db();
      await sql`CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        kind TEXT NOT NULL DEFAULT '',
        platform TEXT NOT NULL DEFAULT 'ig_post',
        date TEXT NOT NULL,
        time TEXT,
        status TEXT NOT NULL DEFAULT 'idea',
        caption TEXT NOT NULL DEFAULT '',
        hashtags TEXT NOT NULL DEFAULT '',
        files JSONB NOT NULL DEFAULT '[]'::jsonb,
        affiliate_link TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT 'manual',
        posted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`CREATE INDEX IF NOT EXISTS items_date_idx ON items (date)`;
      await sql`CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slots JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

function rowToItem(r: Record<string, unknown>): Item {
  return {
    id: Number(r.id),
    title: String(r.title ?? ""),
    kind: String(r.kind ?? ""),
    platform: normalizePlatform(r.platform),
    date: String(r.date),
    time: (r.time as string) || null,
    status: normalizeStatus(r.status, "idea"),
    caption: String(r.caption ?? ""),
    hashtags: String(r.hashtags ?? ""),
    files: Array.isArray(r.files) ? (r.files as FileRef[]) : [],
    affiliate_link: String(r.affiliate_link ?? ""),
    notes: String(r.notes ?? ""),
    source: String(r.source ?? "manual"),
    posted_at: r.posted_at ? new Date(r.posted_at as string).toISOString() : null,
    created_at: r.created_at ? new Date(r.created_at as string).toISOString() : "",
  };
}

export async function listItems(from: string, to: string): Promise<Item[]> {
  await ensureSchema();
  const rows = await db()`SELECT * FROM items WHERE date >= ${from} AND date <= ${to}
    ORDER BY date, time NULLS LAST, id`;
  return rows.map(rowToItem);
}

export async function listOverdue(today: string, lookbackFrom: string): Promise<Item[]> {
  await ensureSchema();
  const rows = await db()`SELECT * FROM items WHERE date < ${today} AND date >= ${lookbackFrom}
    AND status <> 'posted' AND status <> 'idea' ORDER BY date, time NULLS LAST`;
  return rows.map(rowToItem);
}

export async function getItem(id: number): Promise<Item | null> {
  await ensureSchema();
  const rows = await db()`SELECT * FROM items WHERE id = ${id}`;
  return rows[0] ? rowToItem(rows[0]) : null;
}

export type ItemInput = Partial<Omit<Item, "id" | "created_at" | "posted_at">>;

export function cleanInput(input: ItemInput): ItemInput {
  const out: ItemInput = {};
  if (input.title !== undefined) out.title = String(input.title).slice(0, 300);
  if (input.kind !== undefined) out.kind = String(input.kind).slice(0, 60);
  if (input.platform !== undefined) out.platform = normalizePlatform(input.platform);
  if (input.status !== undefined) out.status = normalizeStatus(input.status, "idea");
  if (input.date !== undefined && isValidDate(input.date)) out.date = input.date;
  if (input.time !== undefined) out.time = isValidTime(input.time) ? input.time : null;
  if (input.caption !== undefined) out.caption = String(input.caption).slice(0, 10000);
  if (input.hashtags !== undefined) out.hashtags = String(input.hashtags).slice(0, 3000);
  if (input.affiliate_link !== undefined) out.affiliate_link = String(input.affiliate_link).slice(0, 2000);
  if (input.notes !== undefined) out.notes = String(input.notes).slice(0, 5000);
  if (input.source !== undefined) out.source = String(input.source).slice(0, 40);
  if (input.files !== undefined && Array.isArray(input.files)) {
    out.files = input.files
      .filter((f) => f && typeof f.url === "string" && /^https:\/\//.test(f.url))
      .map((f) => ({
        url: f.url,
        downloadUrl: typeof f.downloadUrl === "string" ? f.downloadUrl : undefined,
        name: String(f.name ?? "file").slice(0, 200),
        type: String(f.type ?? ""),
        size: typeof f.size === "number" ? f.size : undefined,
      }));
  }
  return out;
}

export async function createItem(input: ItemInput & { date: string }): Promise<Item> {
  await ensureSchema();
  const c = cleanInput(input);
  const rows = await db()`INSERT INTO items
    (title, kind, platform, date, time, status, caption, hashtags, files, affiliate_link, notes, source)
    VALUES (${c.title ?? ""}, ${c.kind ?? ""}, ${c.platform ?? "ig_post"}, ${c.date ?? input.date},
      ${c.time ?? null}, ${c.status ?? "idea"}, ${c.caption ?? ""}, ${c.hashtags ?? ""},
      ${JSON.stringify(c.files ?? [])}::jsonb, ${c.affiliate_link ?? ""}, ${c.notes ?? ""},
      ${c.source ?? "manual"})
    RETURNING *`;
  return rowToItem(rows[0]);
}

export async function updateItem(id: number, input: ItemInput): Promise<Item | null> {
  await ensureSchema();
  const cur = await getItem(id);
  if (!cur) return null;
  const c = { ...cur, ...cleanInput(input) };
  const becamePosted = c.status === "posted" && cur.status !== "posted";
  const rows = await db()`UPDATE items SET
      title = ${c.title}, kind = ${c.kind}, platform = ${c.platform}, date = ${c.date},
      time = ${c.time}, status = ${c.status}, caption = ${c.caption}, hashtags = ${c.hashtags},
      files = ${JSON.stringify(c.files)}::jsonb, affiliate_link = ${c.affiliate_link},
      notes = ${c.notes},
      posted_at = CASE WHEN ${becamePosted} THEN now()
                       WHEN ${c.status} <> 'posted' THEN NULL ELSE posted_at END,
      updated_at = now()
    WHERE id = ${id} RETURNING *`;
  return rows[0] ? rowToItem(rows[0]) : null;
}

export async function deleteItem(id: number): Promise<Item | null> {
  await ensureSchema();
  const rows = await db()`DELETE FROM items WHERE id = ${id} RETURNING *`;
  return rows[0] ? rowToItem(rows[0]) : null;
}

export async function listTemplates(): Promise<Template[]> {
  await ensureSchema();
  const rows = await db()`SELECT * FROM templates ORDER BY id`;
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    slots: (r.slots as TemplateSlot[]) ?? [],
    created_at: String(r.created_at),
  }));
}

export async function getTemplate(id: number): Promise<Template | null> {
  return (await listTemplates()).find((t) => t.id === id) ?? null;
}

function cleanSlots(slots: TemplateSlot[]): TemplateSlot[] {
  return (slots ?? [])
    .filter((s) => s && Number.isInteger(s.weekday) && s.weekday >= 0 && s.weekday <= 6)
    .map((s) => ({
      weekday: s.weekday,
      time: isValidTime(s.time) ? s.time : "",
      platform: normalizePlatform(s.platform),
      kind: String(s.kind ?? "").slice(0, 60),
      title: String(s.title ?? "").slice(0, 200),
    }))
    .sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time));
}

export async function saveTemplate(id: number | null, name: string, slots: TemplateSlot[]) {
  await ensureSchema();
  const clean = JSON.stringify(cleanSlots(slots));
  const n = name.trim().slice(0, 100) || "תבנית שבועית";
  if (id) {
    await db()`UPDATE templates SET name = ${n}, slots = ${clean}::jsonb WHERE id = ${id}`;
    return id;
  }
  const rows = await db()`INSERT INTO templates (name, slots) VALUES (${n}, ${clean}::jsonb) RETURNING id`;
  return Number(rows[0].id);
}

export async function deleteTemplate(id: number) {
  await ensureSchema();
  await db()`DELETE FROM templates WHERE id = ${id}`;
}
