"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import type { FileRef, Item } from "@/lib/db";
import { KINDS, PLATFORMS, STATUSES } from "@/lib/constants";
import { copyText, downloadFiles, fullCaption, isImage, isVideo } from "@/lib/client";
import { deleteItemAction, duplicateItemAction, saveItemAction } from "@/app/actions";
import { toast } from "./Toast";

type Draft = Omit<Item, "id" | "created_at" | "posted_at" | "source">;

export function ItemForm({ item, defaultDate }: { item: Item | null; defaultDate: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [d, setD] = useState<Draft>(
    item ?? {
      title: "",
      kind: "",
      platform: "ig_post",
      date: defaultDate,
      time: null,
      status: "idea",
      caption: "",
      hashtags: "",
      files: [],
      affiliate_link: "",
      notes: "",
    }
  );
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const tagCount = (d.hashtags.match(/#[^\s#]+/g) ?? []).length;

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    const added: FileRef[] = [];
    try {
      for (const f of Array.from(list)) {
        setUploading(`מעלה ${f.name}…`);
        const blob = await upload(`items/${f.name.replace(/[^\w.\-]/g, "_")}`, f, {
          access: "public",
          handleUploadUrl: "/api/upload",
          multipart: f.size > 8 * 1024 * 1024,
          onUploadProgress: (p) => setUploading(`מעלה ${f.name} · ${Math.round(p.percentage)}%`),
        });
        added.push({ url: blob.url, downloadUrl: blob.downloadUrl, name: f.name, type: f.type, size: f.size });
      }
      setD((x) => ({ ...x, files: [...x.files, ...added] }));
      toast("הקבצים הועלו ✓");
    } catch (e) {
      toast("ההעלאה נכשלה: " + (e as Error).message);
    } finally {
      setUploading(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function save(statusOverride?: Draft["status"]) {
    start(async () => {
      const saved = await saveItemAction(item?.id ?? null, { ...d, status: statusOverride ?? d.status });
      toast("נשמר ✓");
      if (!item && saved) router.replace(`/item/${saved.id}`);
      else if (statusOverride) set("status", statusOverride);
    });
  }

  return (
    <form
      className="mx-auto max-w-2xl space-y-4 pb-6 pt-1"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => router.back()} className="btn btn-ghost h-11 w-11 px-0" aria-label="חזרה">→</button>
        <h1 className="flex-1 text-2xl font-black">{item ? "עריכת פריט" : "פריט חדש"}</h1>
        {item && (
          <button
            type="button"
            className="btn btn-ghost min-h-10 text-sm"
            onClick={() => start(async () => { const id = await duplicateItemAction(item.id); toast("שוכפל ✓"); router.push(`/item/${id}`); })}
          >
            ⧉ שכפל
          </button>
        )}
      </div>

      {/* quick actions for the posting moment */}
      {item && (
        <div className="grid grid-cols-3 gap-2">
          <button type="button" className="btn btn-soft text-sm" disabled={!fullCaption(d)} onClick={async () => { if (await copyText(fullCaption(d))) toast("הכיתוב הועתק ✓"); }}>📋 כיתוב</button>
          <button type="button" className="btn btn-soft text-sm" disabled={!d.files.length} onClick={() => downloadFiles(d.files)}>⬇️ הורדה</button>
          <button type="button" className={`btn text-sm ${d.status === "posted" ? "bg-green-100 text-green-800" : "btn-primary"}`} onClick={() => save(d.status === "posted" ? "ready" : "posted")}>
            {d.status === "posted" ? "✅ עלה" : "סמן כעלה"}
          </button>
        </div>
      )}

      <div className="card space-y-4 p-4">
        <div>
          <label className="label">כותרת פנימית</label>
          <input className="field" value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="למשל: מלון בוטיק באתונה" />
        </div>

        <div>
          <label className="label">פלטפורמה</label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {PLATFORMS.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => set("platform", p.id)}
                className="rounded-xl px-2 py-2.5 text-sm font-bold ring-1 transition"
                style={d.platform === p.id ? { background: p.color, color: "#fff", boxShadow: "none" } : { background: "#fff", color: "#334155", boxShadow: "0 0 0 1px #E2E8F0" }}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">סטטוס</label>
          <div className="grid grid-cols-4 gap-2">
            {STATUSES.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => set("status", s.id)}
                className="rounded-xl py-2.5 text-sm font-bold transition"
                style={d.status === s.id ? { background: s.color, color: "#fff" } : { background: s.bg, color: s.color }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">תאריך</label>
            <input type="date" className="field" value={d.date} onChange={(e) => e.target.value && set("date", e.target.value)} required />
          </div>
          <div>
            <label className="label">שעה</label>
            <input type="time" className="field" value={d.time ?? ""} onChange={(e) => set("time", e.target.value || null)} />
          </div>
        </div>

        <div>
          <label className="label">סוג תוכן</label>
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            {KINDS.map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => set("kind", d.kind === k ? "" : k)}
                className={`chip ${d.kind === k ? "bg-ink text-white ring-ink" : "bg-white text-slate-600 ring-slate-200"}`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-4">
        <div>
          <div className="flex items-baseline justify-between">
            <label className="label">כיתוב</label>
            <span className="text-xs text-slate-400">{d.caption.length} תווים</span>
          </div>
          <textarea className="field min-h-40 leading-relaxed" value={d.caption} onChange={(e) => set("caption", e.target.value)} placeholder="הטקסט שיעלה עם הפוסט" />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label className="label">האשטגים</label>
            <span className={`text-xs ${tagCount > 30 ? "font-bold text-red-600" : "text-slate-400"}`}>{tagCount}/30</span>
          </div>
          <textarea className="field min-h-20" dir="auto" value={d.hashtags} onChange={(e) => set("hashtags", e.target.value)} placeholder="#דילוש #חופשה #מלונות" />
        </div>
        <div>
          <label className="label">קישור שותפים</label>
          <input className="field" dir="ltr" inputMode="url" value={d.affiliate_link} onChange={(e) => set("affiliate_link", e.target.value)} placeholder="https://" />
          {d.affiliate_link && (
            <button type="button" className="mt-1.5 text-sm font-bold text-brand" onClick={async () => { if (await copyText(d.affiliate_link)) toast("הקישור הועתק ✓"); }}>
              העתק קישור
            </button>
          )}
        </div>
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <label className="label mb-0">קבצים (תמונה / וידאו)</label>
          <button type="button" className="btn btn-soft min-h-10 text-sm" onClick={() => fileInput.current?.click()} disabled={!!uploading}>
            + העלאה
          </button>
          <input ref={fileInput} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        </div>
        {uploading && <p className="text-sm font-semibold text-brand">{uploading}</p>}
        {d.files.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {d.files.map((f) => (
              <div key={f.url} className="group relative overflow-hidden rounded-xl bg-slate-100">
                {isImage(f) ? (
                  <img src={f.url} alt={f.name} className="aspect-square w-full object-cover" />
                ) : isVideo(f) ? (
                  <video src={f.url} className="aspect-square w-full object-cover" muted playsInline controls preload="metadata" />
                ) : (
                  <div className="flex aspect-square items-center justify-center p-2 text-center text-xs">{f.name}</div>
                )}
                <div className="absolute inset-x-1 top-1 flex justify-between">
                  <button type="button" onClick={() => downloadFiles([f])} className="rounded-lg bg-white/90 px-2 py-1 text-xs font-bold shadow">⬇️</button>
                  <button type="button" onClick={() => set("files", d.files.filter((x) => x.url !== f.url))} className="rounded-lg bg-white/90 px-2 py-1 text-xs font-bold text-red-600 shadow">✕</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">התמונות נשמרות באיכות מלאה, בלי דחיסה.</p>
        )}
      </div>

      <div className="card p-4">
        <label className="label">הערות</label>
        <textarea className="field min-h-20" value={d.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <div className="sticky bottom-24 z-10 flex gap-2">
        <button type="submit" className="btn btn-primary flex-1 py-3.5 text-base shadow-lg" disabled={pending || !!uploading}>
          {pending ? "שומר…" : "שמור"}
        </button>
        {item && (
          <button
            type="button"
            className="btn btn-ghost px-4 text-red-600 shadow-lg"
            disabled={pending}
            onClick={() => {
              if (!confirm("למחוק את הפריט?")) return;
              start(async () => { await deleteItemAction(item.id); toast("נמחק"); router.push("/calendar?d=" + item.date); });
            }}
          >
            מחק
          </button>
        )}
      </div>
    </form>
  );
}
