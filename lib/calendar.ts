import { HebrewCalendar, flags, type Event } from "@hebcal/core";
import { addDays, daysBetween, parseDate } from "./dates";

export type DayMark = { date: string; label: string; type: "holiday" | "vacation" | "memorial" };

/**
 * School vacations, Israeli state education, school year 2026–2027 (תשפ"ז).
 * Source: Ministry of Education vacation calendar as published by news sites —
 * verify against the official calendar and edit here when it changes.
 */
export const SCHOOL_VACATIONS: { from: string; to: string; label: string }[] = [
  { from: "2026-12-06", to: "2026-12-12", label: "חופשת חנוכה" },
  { from: "2027-03-23", to: "2027-03-24", label: "חופשת פורים" },
  { from: "2027-04-13", to: "2027-04-28", label: "חופשת פסח" },
  { from: "2027-06-10", to: "2027-06-11", label: "חופשת שבועות" },
  { from: "2027-06-21", to: "2027-06-30", label: "חופש גדול (חטיבות ותיכונים)" },
  { from: "2027-07-01", to: "2027-08-31", label: "החופש הגדול" },
];

function localISO(d: Date): string {
  // Hebcal returns local-midnight dates, so read local components (not toISOString).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const SKIP = /פורים קטן|שושן פורים קטן|פסח שני|יום בן|יום הרצל|יום המשפחה|יום השפה|חג הבנות|יום העליה|ערב פורים/;

function holidayLabel(e: Event): string | null {
  const f = e.getFlags();
  let he = e.render("he-x-NoNikud");
  if (SKIP.test(he)) return null;
  if (f & flags.CHANUKAH_CANDLES || /חנוכה/.test(he)) {
    const m = he.match(/חנוכה: ([^ ]+) נר/);
    return m ? `חנוכה (נר ${m[1]})` : "חנוכה";
  }
  he = he.replace(/\s*\(חוה״מ\)/, " · חוה״מ");
  return he;
}

export function marksBetween(from: string, to: string): Map<string, DayMark[]> {
  const out = new Map<string, DayMark[]>();
  const push = (m: DayMark) => {
    const arr = out.get(m.date) ?? [];
    if (!arr.some((x) => x.label === m.label)) arr.push(m);
    out.set(m.date, arr);
  };

  const f = parseDate(from);
  const t = parseDate(to);
  const events = HebrewCalendar.calendar({
    start: new Date(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate()),
    end: new Date(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()),
    il: true,
    noRoshChodesh: true,
    noSpecialShabbat: true,
    noMinorFast: true,
    sedrot: false,
    candlelighting: false,
  });
  for (const e of events) {
    const label = holidayLabel(e);
    if (!label) continue;
    const memorial = /השואה|הזכרון/.test(label);
    push({ date: localISO(e.getDate().greg()), label, type: memorial ? "memorial" : "holiday" });
  }

  for (const v of SCHOOL_VACATIONS) {
    if (v.to < from || v.from > to) continue;
    const start = v.from < from ? from : v.from;
    const end = v.to > to ? to : v.to;
    for (let d = start; d <= end; d = addDays(d, 1)) {
      push({ date: d, label: v.label, type: "vacation" });
    }
  }
  return out;
}

/** Nearest upcoming holiday / vacation start, for the "coming up" banner. */
export function upcoming(today: string, withinDays = 21): { label: string; date: string; inDays: number }[] {
  const end = addDays(today, withinDays);
  const marks = marksBetween(today, end);
  const seen = new Set<string>();
  const res: { label: string; date: string; inDays: number }[] = [];
  for (const [date, list] of [...marks.entries()].sort()) {
    for (const m of list) {
      if (m.type === "memorial") continue;
      const key = m.label.replace(/ \(נר.*\)| · חוה״מ|[א-ת]׳$/g, "").replace(/ [א-ז]׳$/, "").trim();
      if (seen.has(key)) continue;
      seen.add(key);
      res.push({ label: key, date, inDays: daysBetween(today, date) });
    }
  }
  return res.slice(0, 3);
}
