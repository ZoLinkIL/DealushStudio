import { platformOf, statusOf } from "./constants";
import type { Item } from "./db";
import { prettyDate } from "./dates";

export function telegramConfigured() {
  return !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID;
}

export function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function studioUrl() {
  return (process.env.STUDIO_URL || process.env.AUTH_URL || "").replace(/\/$/, "");
}

export async function tg(method: string, body: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, description: "TELEGRAM_BOT_TOKEN missing" };
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json().catch(() => ({ ok: false }))) as { ok: boolean; description?: string; result?: unknown };
}

/** Sends to the owner's chat only. Never throws — notifications must not break the app. */
export async function notify(text: string, buttonPath?: string, buttonLabel = "פתח בסטודיו") {
  try {
    if (!telegramConfigured()) return { ok: false, description: "not configured" };
    const base = studioUrl();
    const reply_markup =
      buttonPath && base.startsWith("https://")
        ? { inline_keyboard: [[{ text: buttonLabel, url: base + buttonPath }]] }
        : undefined;
    return await tg("sendMessage", {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup,
    });
  } catch (e) {
    console.error("telegram notify failed", e);
    return { ok: false, description: String(e) };
  }
}

export function itemLine(i: Item) {
  const p = platformOf(i.platform);
  const s = statusOf(i.status);
  const done = i.status === "posted" ? "✅ " : "";
  return `${done}${i.time ? `<b>${i.time}</b> ` : ""}${p.emoji} ${esc(p.label)} · ${esc(i.title || i.kind || "ללא כותרת")} <i>(${s.label})</i>`;
}

export function dayDigest(date: string, items: Item[], extra: string[] = []) {
  const head = `☀️ <b>מה עולה היום</b> · ${prettyDate(date)}`;
  const body = items.length ? items.map(itemLine).join("\n") : "אין תוכן מתוכנן להיום.";
  return [head, "", body, ...(extra.length ? ["", ...extra] : [])].join("\n");
}
