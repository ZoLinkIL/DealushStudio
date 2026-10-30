"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import type { Item } from "@/lib/db";
import type { DayMark } from "@/lib/calendar";
import { MONTHS, PLATFORMS, STATUSES, WEEKDAYS, WEEKDAYS_SHORT, platformOf, statusOf } from "@/lib/constants";
import { addDays, addMonths, parseDate, startOfMonth } from "@/lib/dates";
import { moveItemAction } from "@/app/actions";
import { toast } from "./Toast";

type Props = {
  view: "week" | "month";
  anchor: string;
  from: string;
  to: string;
  today: string;
  items: Item[];
  marks: Record<string, DayMark[]>;
};

const FILTER_KEY = "studio-cal-filters";

const markStyle: Record<DayMark["type"], string> = {
  holiday: "bg-sun/35 text-amber-900",
  vacation: "bg-emerald-100 text-emerald-800",
  memorial: "bg-slate-200 text-slate-700",
};

/* ---------- chips ---------- */

function ChipBody({ item, compact = false }: { item: Item; compact?: boolean }) {
  const p = platformOf(item.platform);
  const s = statusOf(item.status);
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border-s-4 bg-white px-2 py-1.5 text-start shadow-sm ring-1 ring-slate-200/70 ${
        item.status === "posted" ? "opacity-55" : ""
      }`}
      style={{ borderInlineStartColor: p.color }}
    >
      <span className="text-sm" aria-hidden>{p.emoji}</span>
      <div className="min-w-0 flex-1 leading-tight">
        {item.time && <p className="text-[11px] font-semibold tabular-nums text-slate-500">{item.time}</p>}
        <p className={`line-clamp-2 font-bold ${compact ? "text-xs" : "text-sm"}`}>{item.title || item.kind || p.short}</p>
      </div>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} title={s.label} />
    </div>
  );
}

function DraggableChip({ item, compact }: { item: Item; compact?: boolean }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id, data: item });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => router.push(`/item/${item.id}`)}
      className={`cursor-grab select-none [-webkit-touch-callout:none] ${isDragging ? "opacity-30" : ""}`}
      style={{ touchAction: "manipulation" }}
    >
      <ChipBody item={item} compact={compact} />
    </div>
  );
}

function DayDrop({ date, className, children, onClick }: { date: string; className?: string; children: React.ReactNode; onClick?: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: date });
  return (
    <div ref={setNodeRef} onClick={onClick} className={`${className ?? ""} ${isOver ? "ring-2 ring-brand bg-brand-50" : ""}`}>
      {children}
    </div>
  );
}

/* ---------- main ---------- */

export function CalendarView({ view, anchor, from, to, today, items, marks }: Props) {
  const [local, setLocal] = useState(items);
  useEffect(() => setLocal(items), [items]);

  const [plats, setPlats] = useState<string[]>([]);
  const [stats, setStats] = useState<string[]>([]);
  useEffect(() => {
    try {
      const f = JSON.parse(localStorage.getItem(FILTER_KEY) ?? "{}");
      setPlats(f.p ?? []);
      setStats(f.s ?? []);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify({ p: plats, s: stats }));
    } catch {}
  }, [plats, stats]);

  const [selected, setSelected] = useState<string>(anchor >= from && anchor <= to ? anchor : from);
  const [dragging, setDragging] = useState<Item | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 280, tolerance: 8 } })
  );

  const visible = useMemo(
    () =>
      local.filter(
        (i) => (!plats.length || plats.includes(i.platform)) && (!stats.length || stats.includes(i.status))
      ),
    [local, plats, stats]
  );
  const byDay = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of visible) m.set(i.date, [...(m.get(i.date) ?? []), i]);
    return m;
  }, [visible]);

  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);

  function onDragStart(e: DragStartEvent) {
    setDragging((e.active.data.current as Item) ?? null);
    navigator.vibrate?.(15);
  }
  async function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    const id = Number(e.active.id);
    const date = e.over?.id as string | undefined;
    const item = local.find((i) => i.id === id);
    if (!item || !date || date === item.date) return;
    setLocal((cur) => cur.map((i) => (i.id === id ? { ...i, date } : i)));
    try {
      await moveItemAction(id, date);
      const d = parseDate(date);
      toast(`הועבר ל-${d.getUTCDate()}.${d.getUTCMonth() + 1}`);
    } catch {
      setLocal(items);
      toast("ההעברה נכשלה");
    }
  }

  const a = parseDate(view === "month" ? startOfMonth(anchor) : from);
  const title =
    view === "month"
      ? `${MONTHS[a.getUTCMonth()]} ${a.getUTCFullYear()}`
      : `${parseDate(from).getUTCDate()}.${parseDate(from).getUTCMonth() + 1} – ${parseDate(to).getUTCDate()}.${parseDate(to).getUTCMonth() + 1}`;
  const prev = view === "month" ? addMonths(anchor, -1) : addDays(from, -7);
  const next = view === "month" ? addMonths(anchor, 1) : addDays(from, 7);
  const q = (d: string, v = view) => `/calendar?view=${v}&d=${d}`;
  const monthNum = startOfMonth(anchor).slice(0, 7);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="space-y-3 pt-1">
      {/* header */}
      <div className="flex items-center gap-2">
        <Link href={q(prev)} className="btn btn-ghost h-11 w-11 px-0" aria-label="הקודם">→</Link>
        <h1 className="flex-1 text-center text-xl font-black">{title}</h1>
        <Link href={q(next)} className="btn btn-ghost h-11 w-11 px-0" aria-label="הבא">←</Link>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
          {(["week", "month"] as const).map((v) => (
            <Link
              key={v}
              href={q(anchor, v)}
              className={`rounded-lg px-4 py-2 text-sm font-bold ${view === v ? "bg-brand text-white" : "text-slate-600"}`}
            >
              {v === "week" ? "שבוע" : "חודש"}
            </Link>
          ))}
        </div>
        <Link href={q(today)} className="btn btn-soft min-h-10 text-sm">היום</Link>
        <span className="flex-1" />
        <span className="text-sm text-slate-500">{visible.length} פריטים</span>
      </div>

      {/* filters */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {PLATFORMS.map((p) => {
          const on = plats.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(plats, setPlats, p.id)}
              className="chip"
              style={on ? { background: p.color, color: "#fff", boxShadow: "none" } : { background: "#fff", color: "#334155", boxShadow: "0 0 0 1px #E2E8F0" }}
            >
              {p.emoji} {p.short}
            </button>
          );
        })}
        <span className="mx-1 w-px shrink-0 bg-slate-200" />
        {STATUSES.map((s) => {
          const on = stats.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(stats, setStats, s.id)}
              className="chip"
              style={on ? { background: s.color, color: "#fff", boxShadow: "none" } : { background: "#fff", color: s.color, boxShadow: "0 0 0 1px #E2E8F0" }}
            >
              {s.label}
            </button>
          );
        })}
        {(plats.length > 0 || stats.length > 0) && (
          <button onClick={() => { setPlats([]); setStats([]); }} className="chip bg-white text-slate-500 ring-slate-200">
            נקה ✕
          </button>
        )}
      </div>

      <DndContext id="studio-calendar" sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        {view === "week" ? (
          <div className="grid gap-2.5 md:grid-cols-7 md:gap-2">
            {days.map((d, idx) => {
              const list = byDay.get(d) ?? [];
              const dm = marks[d] ?? [];
              const isToday = d === today;
              return (
                <DayDrop key={d} date={d} className={`card flex flex-col p-2.5 transition md:min-h-64 ${isToday ? "ring-2 ring-brand" : ""}`}>
                  <div className={`flex items-center gap-2 ${list.length || dm.length ? "mb-2" : ""}`}>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-base font-black ${isToday ? "bg-brand text-white" : "bg-slate-100"}`}>
                      {parseDate(d).getUTCDate()}
                    </span>
                    <span className="font-bold">{WEEKDAYS[idx % 7]}</span>
                    <span className="flex-1" />
                    <Link href={`/item/new?d=${d}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-xl font-bold text-brand hover:bg-brand-50" aria-label="הוסף">+</Link>
                  </div>
                  {dm.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {dm.map((m) => (
                        <span key={m.label} className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${markStyle[m.type]}`}>{m.label}</span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {list.map((i) => <DraggableChip key={i.id} item={i} />)}
                  </div>
                </DayDrop>
              );
            })}
          </div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-xs font-bold text-slate-500">
                {WEEKDAYS_SHORT.map((w) => <div key={w} className="py-2">{w}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {days.map((d) => {
                  const list = byDay.get(d) ?? [];
                  const dm = marks[d] ?? [];
                  const out = d.slice(0, 7) !== monthNum;
                  const isToday = d === today;
                  const isSel = d === selected;
                  return (
                    <DayDrop
                      key={d}
                      date={d}
                      onClick={() => setSelected(d)}
                      className={`min-h-16 cursor-pointer border-b border-e border-slate-100 p-1 transition md:min-h-28 ${out ? "bg-slate-50/70 text-slate-300" : ""} ${isSel ? "bg-brand-50" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${isToday ? "bg-brand text-white" : ""}`}>
                          {parseDate(d).getUTCDate()}
                        </span>
                      </div>
                      {dm.length > 0 && (
                        <div className={`mt-0.5 truncate rounded px-1 text-[10px] font-bold leading-4 ${markStyle[dm[0].type]}`} title={dm.map((m) => m.label).join(" · ")}>
                          {dm[0].label.replace(/ \(.*\)| · .*/, "")}
                        </div>
                      )}
                      {/* phone: dots, desktop: chips */}
                      <div className="mt-1 flex flex-wrap gap-0.5 md:hidden">
                        {list.slice(0, 6).map((i) => (
                          <span key={i.id} className="h-2 w-2 rounded-full" style={{ background: platformOf(i.platform).color, opacity: i.status === "posted" ? 0.35 : 1 }} />
                        ))}
                      </div>
                      <div className="mt-1 hidden space-y-1 md:block">
                        {list.slice(0, 3).map((i) => <DraggableChip key={i.id} item={i} compact />)}
                        {list.length > 3 && <p className="text-[11px] font-bold text-slate-500">+{list.length - 3} נוספים</p>}
                      </div>
                    </DayDrop>
                  );
                })}
              </div>
            </div>

            <section className="space-y-2">
              <div className="flex items-center">
                <h2 className="flex-1 font-black">
                  {WEEKDAYS[parseDate(selected).getUTCDay()]} {parseDate(selected).getUTCDate()}.{parseDate(selected).getUTCMonth() + 1}
                  {(marks[selected] ?? []).map((m) => (
                    <span key={m.label} className={`ms-2 rounded-md px-1.5 py-0.5 text-xs font-bold ${markStyle[m.type]}`}>{m.label}</span>
                  ))}
                </h2>
                <Link href={`/item/new?d=${selected}`} className="btn btn-soft min-h-10 text-sm">+ הוסף</Link>
              </div>
              {(byDay.get(selected) ?? []).map((i) => <DraggableChip key={i.id} item={i} />)}
              {!(byDay.get(selected) ?? []).length && <p className="text-sm text-slate-400">אין פריטים ביום הזה.</p>}
              <p className="text-xs text-slate-400">טיפ: לחיצה ארוכה על פריט וגרירה ליום אחר בלוח מעבירה אותו.</p>
            </section>
          </>
        )}

        <DragOverlay dropAnimation={null}>
          {dragging ? <div className="w-56 rotate-2 scale-105"><ChipBody item={dragging} /></div> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
