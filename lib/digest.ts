import { listItems, listOverdue } from "./db";
import { addDays, prettyDate, todayIL } from "./dates";
import { upcoming } from "./calendar";
import { dayDigest, esc, itemLine } from "./telegram";

export async function buildMorningDigest(date = todayIL()) {
  const items = await listItems(date, date);
  const overdue = await listOverdue(date, addDays(date, -7));
  const extra: string[] = [];
  if (overdue.length) {
    extra.push(`⚠️ <b>נשאר מהימים הקודמים (${overdue.length})</b>`);
    extra.push(...overdue.slice(0, 5).map((i) => `${prettyDate(i.date)} · ${itemLine(i)}`));
  }
  const soon = upcoming(date, 21).filter((u) => u.inDays > 0);
  if (soon.length) {
    extra.push("📅 <b>בקרוב</b>: " + soon.map((u) => `${esc(u.label)} בעוד ${u.inDays} ימים`).join(" · "));
  }
  return dayDigest(date, items, extra);
}

export async function buildDayList(date: string, title: string) {
  const items = await listItems(date, date);
  const body = items.length ? items.map(itemLine).join("\n") : "אין תוכן מתוכנן.";
  return `<b>${title}</b> · ${prettyDate(date)}\n\n${body}`;
}

export async function buildWeekList(from: string) {
  const to = addDays(from, 6);
  const items = await listItems(from, to);
  if (!items.length) return "<b>השבוע</b>\n\nאין תוכן מתוכנן לשבוע הקרוב.";
  const lines: string[] = ["<b>7 הימים הקרובים</b>"];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const day = items.filter((i) => i.date === d);
    if (!day.length) continue;
    lines.push("", `<u>${prettyDate(d)}</u>`, ...day.map(itemLine));
  }
  return lines.join("\n");
}
