"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/auth";
import {
  createItem, deleteItem, deleteTemplate, getItem, getTemplate, listItems, saveTemplate, updateItem,
  type ItemInput, type TemplateSlot,
} from "@/lib/db";
import { addDays, isValidDate, startOfWeek, todayIL, weekday } from "@/lib/dates";
import { notify, tg, telegramConfigured, studioUrl } from "@/lib/telegram";

function refresh() {
  revalidatePath("/", "layout");
}

export async function saveItemAction(id: number | null, input: ItemInput) {
  await requireUser();
  const item = id
    ? await updateItem(id, input)
    : await createItem({ ...input, date: isValidDate(input.date) ? input.date : todayIL() });
  refresh();
  return item;
}

export async function moveItemAction(id: number, date: string) {
  await requireUser();
  if (!isValidDate(date)) throw new Error("תאריך לא תקין");
  await updateItem(id, { date });
  refresh();
}

export async function setStatusAction(id: number, status: string) {
  await requireUser();
  await updateItem(id, { status: status as ItemInput["status"] });
  refresh();
}

export async function duplicateItemAction(id: number) {
  await requireUser();
  const cur = await getItem(id);
  if (!cur) throw new Error("לא נמצא");
  const { id: _id, created_at: _c, posted_at: _p, ...rest } = cur;
  const copy = await createItem({
    ...rest,
    title: rest.title ? `${rest.title} (עותק)` : "",
    status: rest.status === "posted" ? "ready" : rest.status,
    source: "manual",
  });
  refresh();
  return copy.id;
}

export async function deleteItemAction(id: number) {
  await requireUser();
  // Uploaded files are kept in Blob storage on purpose: duplicated items share them.
  await deleteItem(id);
  refresh();
}

/* ---------- templates ---------- */

export async function saveTemplateAction(id: number | null, name: string, slots: TemplateSlot[]) {
  await requireUser();
  const newId = await saveTemplate(id, name, slots);
  refresh();
  return newId;
}

export async function deleteTemplateAction(id: number) {
  await requireUser();
  await deleteTemplate(id);
  refresh();
}

/** Creates "idea" items for every slot, in the week that contains `weekOf`. */
export async function applyTemplateAction(id: number, weekOf: string) {
  await requireUser();
  const t = await getTemplate(id);
  if (!t) throw new Error("התבנית לא נמצאה");
  const sunday = startOfWeek(isValidDate(weekOf) ? weekOf : todayIL());
  for (const s of t.slots) {
    await createItem({
      date: addDays(sunday, s.weekday),
      time: s.time || null,
      platform: s.platform,
      kind: s.kind,
      title: s.title,
      status: "idea",
      source: "template",
    });
  }
  refresh();
  return { count: t.slots.length, sunday };
}

/** Builds a template from what is already planned in a given week. */
export async function templateFromWeekAction(weekOf: string, name: string) {
  await requireUser();
  const sunday = startOfWeek(isValidDate(weekOf) ? weekOf : todayIL());
  const items = await listItems(sunday, addDays(sunday, 6));
  const slots: TemplateSlot[] = items.map((i) => ({
    weekday: weekday(i.date),
    time: i.time ?? "",
    platform: i.platform,
    kind: i.kind,
    title: i.title,
  }));
  const newId = await saveTemplate(null, name || "תבנית מהשבוע", slots);
  refresh();
  return newId;
}

/* ---------- telegram ---------- */

export async function telegramTestAction() {
  await requireUser();
  if (!telegramConfigured()) return { ok: false, message: "חסרים TELEGRAM_BOT_TOKEN או TELEGRAM_CHAT_ID" };
  const r = await notify("👋 <b>סטודיו דילוש מחובר</b>\nמכאן יגיעו התראת הבוקר והעדכונים.", "/", "פתח את הסטודיו");
  return { ok: r.ok, message: r.ok ? "נשלחה הודעת בדיקה" : `שגיאה: ${r.description ?? ""}` };
}

export async function telegramWebhookAction(origin: string) {
  await requireUser();
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!process.env.TELEGRAM_BOT_TOKEN || !secret) {
    return { ok: false, message: "חסרים TELEGRAM_BOT_TOKEN או TELEGRAM_WEBHOOK_SECRET" };
  }
  const base = studioUrl() || origin;
  if (!base.startsWith("https://")) return { ok: false, message: "צריך כתובת https" };
  const r = await tg("setWebhook", {
    url: `${base}/api/telegram`,
    secret_token: secret,
    allowed_updates: ["message"],
  });
  await tg("setMyCommands", {
    commands: [
      { command: "today", description: "מה עולה היום" },
      { command: "tomorrow", description: "מה עולה מחר" },
      { command: "week", description: "7 הימים הקרובים" },
    ],
  });
  return { ok: r.ok, message: r.ok ? "הבוט מחובר. נסה לשלוח לו /today" : `שגיאה: ${r.description ?? ""}` };
}
