// All dates in the app are Israel-local "YYYY-MM-DD" strings, times are "HH:MM".
// That keeps the server (UTC on Vercel) and the phone in agreement.

export const TZ = "Asia/Jerusalem";

export function todayIL(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function nowTimeIL(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function parseDate(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: string, n: number): string {
  const x = parseDate(d);
  x.setUTCDate(x.getUTCDate() + n);
  return fmt(x);
}

export function weekday(d: string): number {
  return parseDate(d).getUTCDay(); // 0 = Sunday
}

/** Israeli weeks start on Sunday. */
export function startOfWeek(d: string): string {
  return addDays(d, -weekday(d));
}

export function startOfMonth(d: string): string {
  return d.slice(0, 8) + "01";
}

export function daysInMonth(d: string): number {
  const x = parseDate(startOfMonth(d));
  x.setUTCMonth(x.getUTCMonth() + 1);
  x.setUTCDate(0);
  return x.getUTCDate();
}

export function addMonths(d: string, n: number): string {
  const x = parseDate(startOfMonth(d));
  x.setUTCMonth(x.getUTCMonth() + n);
  return fmt(x);
}

export function isValidDate(d: unknown): d is string {
  return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(parseDate(d).getTime());
}

export function isValidTime(t: unknown): t is string {
  return typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

export function prettyDate(d: string): string {
  const x = parseDate(d);
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  return `יום ${days[x.getUTCDay()]}, ${x.getUTCDate()}.${x.getUTCMonth() + 1}`;
}

export function shortDate(d: string): string {
  const x = parseDate(d);
  return `${x.getUTCDate()}.${x.getUTCMonth() + 1}`;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
}
