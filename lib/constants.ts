export const PLATFORMS = [
  { id: "ig_post", label: "IG פוסט", short: "פוסט", emoji: "📸", color: "#DB2777" },
  { id: "ig_story", label: "IG סטורי", short: "סטורי", emoji: "⭕", color: "#9333EA" },
  { id: "tiktok", label: "TikTok", short: "טיקטוק", emoji: "🎵", color: "#111827" },
  { id: "channel", label: "ערוץ דילים", short: "ערוץ", emoji: "📢", color: "#0284C7" },
  { id: "zolink_story", label: "סטורי ZoLink", short: "ZoLink", emoji: "🔗", color: "#059669" },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["id"];

export const STATUSES = [
  { id: "idea", label: "רעיון", color: "#64748B", bg: "#F1F5F9" },
  { id: "working", label: "בעבודה", color: "#B45309", bg: "#FEF3C7" },
  { id: "ready", label: "מוכן", color: "#1D4ED8", bg: "#DBEAFE" },
  { id: "posted", label: "עלה", color: "#15803D", bg: "#DCFCE7" },
] as const;

export type StatusId = (typeof STATUSES)[number]["id"];

export const KINDS = [
  "המלצת מלון",
  "יעד",
  "דיל",
  "טיפ",
  "מדריך",
  "עונתי",
  "קידום הבוט",
  "אחר",
] as const;

export const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
export const WEEKDAYS_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
export const MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

export function platformOf(id: string) {
  return PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0];
}
export function statusOf(id: string) {
  return STATUSES.find((s) => s.id === id) ?? STATUSES[0];
}

/** Accepts both ids and Hebrew labels (handy for the API). */
export function normalizePlatform(v: unknown): PlatformId {
  const s = String(v ?? "").trim().toLowerCase();
  const hit = PLATFORMS.find(
    (p) => p.id === s || p.label.toLowerCase() === s || p.short.toLowerCase() === s
  );
  return hit?.id ?? "ig_post";
}
export function normalizeStatus(v: unknown, fallback: StatusId = "ready"): StatusId {
  const s = String(v ?? "").trim();
  const hit = STATUSES.find((x) => x.id === s || x.label === s);
  return hit?.id ?? fallback;
}
