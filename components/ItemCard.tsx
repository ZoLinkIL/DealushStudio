"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { Item } from "@/lib/db";
import { copyText, downloadFiles, fullCaption, isImage, isVideo } from "@/lib/client";
import { setStatusAction } from "@/app/actions";
import { PlatformBadge, StatusBadge } from "./Badges";
import { toast } from "./Toast";
import { shortDate } from "@/lib/dates";

export function ItemCard({ item, showDate = false }: { item: Item; showDate?: boolean }) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const posted = item.status === "posted";
  const thumb = item.files.find(isImage) ?? item.files.find(isVideo);
  const caption = fullCaption(item);

  return (
    <article className={`card overflow-hidden transition ${posted ? "opacity-60" : ""}`}>
      <Link href={`/item/${item.id}`} className="flex gap-3 p-3.5">
        {thumb ? (
          isImage(thumb) ? (
            <img src={thumb.url} alt="" className="h-20 w-20 shrink-0 rounded-xl bg-slate-100 object-cover" loading="lazy" />
          ) : (
            <video src={thumb.url} className="h-20 w-20 shrink-0 rounded-xl bg-slate-100 object-cover" muted playsInline preload="metadata" />
          )
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl text-brand/40">✦</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-base font-black tabular-nums">
              {showDate && <span className="text-slate-400">{shortDate(item.date)} · </span>}
              {item.time ?? "—"}
            </span>
            <PlatformBadge id={item.platform} />
            <StatusBadge id={item.status} />
          </div>
          <h3 className="mt-1 truncate font-bold">{item.title || item.kind || "ללא כותרת"}</h3>
          {item.caption && <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{item.caption}</p>}
        </div>
      </Link>

      <div className="grid grid-cols-3 gap-px border-t border-slate-100 bg-slate-100">
        <button
          className="flex min-h-12 items-center justify-center gap-1.5 bg-white text-sm font-bold text-slate-700 active:bg-slate-50 disabled:text-slate-300"
          disabled={!caption}
          onClick={async () => {
            if (await copyText(caption)) toast("הכיתוב הועתק ✓");
          }}
        >
          📋 העתק כיתוב
        </button>
        <button
          className="flex min-h-12 items-center justify-center gap-1.5 bg-white text-sm font-bold text-slate-700 active:bg-slate-50 disabled:text-slate-300"
          disabled={!item.files.length || busy}
          onClick={async () => {
            setBusy(true);
            await downloadFiles(item.files);
            setBusy(false);
          }}
        >
          {busy ? "…" : item.files.length > 1 ? `⬇️ הורד (${item.files.length})` : "⬇️ הורד תמונה"}
        </button>
        <button
          className={`flex min-h-12 items-center justify-center gap-1.5 text-sm font-bold ${posted ? "bg-green-50 text-green-700" : "bg-white text-brand active:bg-brand-50"}`}
          disabled={pending}
          onClick={() =>
            start(async () => {
              await setStatusAction(item.id, posted ? "ready" : "posted");
              toast(posted ? "הוחזר ל'מוכן'" : "סומן כעלה ✓");
            })
          }
        >
          {posted ? "✅ עלה" : "✔️ סמן כעלה"}
        </button>
      </div>
    </article>
  );
}
