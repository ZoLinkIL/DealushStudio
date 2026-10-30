"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Template, TemplateSlot } from "@/lib/db";
import { KINDS, PLATFORMS, WEEKDAYS, WEEKDAYS_SHORT, platformOf } from "@/lib/constants";
import { addDays, shortDate } from "@/lib/dates";
import { applyTemplateAction, deleteTemplateAction, saveTemplateAction, templateFromWeekAction } from "@/app/actions";
import { toast } from "./Toast";

// The suggested starting point: 3–4 posts a week + a daily story.
const STARTER: TemplateSlot[] = [
  { weekday: 0, time: "19:00", platform: "ig_post", kind: "המלצת מלון", title: "פוסט מלון" },
  { weekday: 2, time: "19:00", platform: "ig_post", kind: "יעד", title: "פוסט יעד / מדריך" },
  { weekday: 4, time: "12:00", platform: "ig_post", kind: "דיל", title: "דיל לסופ״ש" },
  { weekday: 3, time: "20:00", platform: "tiktok", kind: "טיפ", title: "טיקטוק טיפ" },
  ...[0, 1, 2, 3, 4, 5, 6].map((w) => ({ weekday: w, time: "20:30", platform: "ig_story" as const, kind: "", title: "סטורי יומי" })),
  { weekday: 1, time: "10:00", platform: "channel", kind: "דיל", title: "דיל לערוץ" },
  { weekday: 3, time: "10:00", platform: "channel", kind: "דיל", title: "דיל לערוץ" },
  { weekday: 0, time: "21:00", platform: "zolink_story", kind: "קידום הבוט", title: "סטורי ZoLink: הבוט" },
];

function Editor({ initial, onDone }: { initial: Template | null; onDone: () => void }) {
  const [name, setName] = useState(initial?.name ?? "השבוע הקבוע שלי");
  const [slots, setSlots] = useState<TemplateSlot[]>(initial?.slots ?? STARTER);
  const [pending, start] = useTransition();
  const upd = (i: number, patch: Partial<TemplateSlot>) => setSlots((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div className="card space-y-3 p-4">
      <input className="field text-lg font-bold" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="space-y-2">
        {slots.map((s, i) => (
          <div key={i} className="space-y-1.5 rounded-xl bg-slate-50 p-2">
            <div className="flex gap-1.5">
              <select className="field min-w-0 flex-1 py-2" value={s.weekday} onChange={(e) => upd(i, { weekday: Number(e.target.value) })}>
                {WEEKDAYS.map((w, j) => <option key={j} value={j}>{w}</option>)}
              </select>
              <input type="time" className="field w-32 min-w-0 shrink-0 py-2" value={s.time} onChange={(e) => upd(i, { time: e.target.value })} />
              <button type="button" className="shrink-0 rounded-xl px-3 text-red-600" onClick={() => setSlots((x) => x.filter((_, j) => j !== i))} aria-label="הסר">✕</button>
            </div>
            <div className="flex gap-1.5">
              <select className="field min-w-0 flex-1 py-2" value={s.platform} onChange={(e) => upd(i, { platform: e.target.value as TemplateSlot["platform"] })}>
                {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>)}
              </select>
              <input className="field min-w-0 flex-[1.4] py-2" value={s.title} placeholder="כותרת" onChange={(e) => upd(i, { title: e.target.value })} list="kinds" />
            </div>
          </div>
        ))}
        <datalist id="kinds">{KINDS.map((k) => <option key={k} value={k} />)}</datalist>
      </div>
      <button type="button" className="btn btn-soft w-full" onClick={() => setSlots((s) => [...s, { weekday: 0, time: "19:00", platform: "ig_post", kind: "", title: "" }])}>
        + שורה
      </button>
      <div className="flex gap-2">
        <button
          className="btn btn-primary flex-1"
          disabled={pending}
          onClick={() => start(async () => { await saveTemplateAction(initial?.id ?? null, name, slots); toast("התבנית נשמרה ✓"); onDone(); })}
        >
          שמור תבנית
        </button>
        <button className="btn btn-ghost" onClick={onDone}>ביטול</button>
      </div>
    </div>
  );
}

export function TemplatesView({ templates, thisWeek, nextWeek }: { templates: Template[]; thisWeek: string; nextWeek: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Template | "new" | null>(templates.length ? null : "new");
  const [pending, start] = useTransition();

  function apply(t: Template, week: string) {
    if (!confirm(`להוסיף ${t.slots.length} פריטים לשבוע ${shortDate(week)}–${shortDate(addDays(week, 6))}?`)) return;
    start(async () => {
      const r = await applyTemplateAction(t.id, week);
      toast(`נוספו ${r.count} פריטים ✓`);
      router.push(`/calendar?view=week&d=${r.sunday}`);
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pt-1">
      <div className="flex items-center">
        <h1 className="flex-1 text-2xl font-black">תבניות שבועיות</h1>
        {!editing && <button className="btn btn-soft text-sm" onClick={() => setEditing("new")}>+ תבנית</button>}
      </div>
      <p className="text-sm text-slate-500">
        תבנית יוצרת את השלד של השבוע בלחיצה אחת. הפריטים נוצרים בסטטוס &quot;רעיון&quot;, ואתה ממלא אותם.
      </p>

      {editing && <Editor initial={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}

      {templates.map((t) => (
        <div key={t.id} className="card p-4">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <h2 className="text-lg font-black">{t.name}</h2>
              <p className="text-sm text-slate-500">{t.slots.length} פריטים בשבוע</p>
            </div>
            <button className="text-sm font-bold text-brand" onClick={() => setEditing(t)}>עריכה</button>
            <button
              className="text-sm font-bold text-red-600"
              onClick={() => confirm("למחוק את התבנית?") && start(async () => { await deleteTemplateAction(t.id); toast("נמחקה"); })}
            >
              מחק
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w, j) => (
              <div key={j}>
                <p className="text-[11px] font-bold text-slate-400">{WEEKDAYS_SHORT[j]}</p>
                <div className="mt-1 flex flex-col items-center gap-0.5">
                  {t.slots.filter((s) => s.weekday === j).map((s, k) => (
                    <span key={k} className="h-2.5 w-full max-w-8 rounded-full" style={{ background: platformOf(s.platform).color }} title={`${s.time} ${platformOf(s.platform).label}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="btn btn-primary text-sm" disabled={pending} onClick={() => apply(t, thisWeek)}>החל על השבוע</button>
            <button className="btn btn-soft text-sm" disabled={pending} onClick={() => apply(t, nextWeek)}>החל על שבוע הבא</button>
          </div>
        </div>
      ))}

      <div className="card p-4">
        <h2 className="font-black">שמור את השבוע הנוכחי כתבנית</h2>
        <p className="mt-1 text-sm text-slate-500">לוקח את כל מה שמתוכנן השבוע והופך אותו לתבנית שאפשר לשכפל.</p>
        <button
          className="btn btn-ghost mt-3 w-full"
          disabled={pending}
          onClick={() => {
            const name = prompt("שם לתבנית", "שבוע " + shortDate(thisWeek));
            if (name) start(async () => { await templateFromWeekAction(thisWeek, name); toast("נוצרה תבנית ✓"); });
          }}
        >
          צור תבנית מהשבוע
        </button>
      </div>
    </div>
  );
}
