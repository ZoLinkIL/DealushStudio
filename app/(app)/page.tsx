import Link from "next/link";
import { listItems, listOverdue } from "@/lib/db";
import { addDays, nowTimeIL, prettyDate, todayIL } from "@/lib/dates";
import { marksBetween, upcoming } from "@/lib/calendar";
import { ItemCard } from "@/components/ItemCard";
import { SetupNotice } from "@/components/SetupNotice";

export default async function TodayPage() {
  if (!process.env.DATABASE_URL) return <SetupNotice />;

  const today = todayIL();
  const [items, overdue, tomorrowItems] = await Promise.all([
    listItems(today, today),
    listOverdue(today, addDays(today, -7)),
    listItems(addDays(today, 1), addDays(today, 1)),
  ]);
  const marks = marksBetween(today, today).get(today) ?? [];
  const soon = upcoming(today, 30).filter((u) => u.inDays > 0);
  const now = nowTimeIL();
  const left = items.filter((i) => i.status !== "posted");
  const done = items.length - left.length;
  const next = left.find((i) => i.time && i.time >= now);

  return (
    <div className="mx-auto max-w-2xl space-y-5 pt-1">
      <section>
        <p className="text-sm font-semibold text-slate-500">{prettyDate(today)}</p>
        <h1 className="text-[28px] font-black leading-tight">מה עושים היום</h1>
        {marks.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {marks.map((m) => (
              <span key={m.label} className="rounded-full bg-sun/30 px-3 py-1 text-sm font-bold text-amber-900">
                {m.label}
              </span>
            ))}
          </div>
        )}
      </section>

      {items.length > 0 && (
        <div className="card flex items-center gap-4 p-4">
          <div className="relative h-14 w-14 shrink-0">
            <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E2E8F0" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" stroke="#1D4ED8" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(done / items.length) * 97.4} 97.4`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black">
              {done}/{items.length}
            </span>
          </div>
          <div>
            <p className="font-bold">{left.length ? `נשארו ${left.length} להעלות` : "הכול עלה היום 🎉"}</p>
            {next && <p className="text-sm text-slate-500">הבא בתור ב-{next.time}: {next.title || next.kind}</p>}
          </div>
        </div>
      )}

      <section className="space-y-3">
        {items.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-lg font-bold">אין תוכן מתוכנן להיום</p>
            <p className="mt-1 text-sm text-slate-500">אפשר להוסיף פריט, או להחיל תבנית שבועית.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Link href={`/item/new?d=${today}`} className="btn btn-primary">+ פריט חדש</Link>
              <Link href="/templates" className="btn btn-soft">תבניות</Link>
            </div>
          </div>
        ) : (
          items.map((i) => <ItemCard key={i.id} item={i} />)
        )}
      </section>

      {overdue.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <span className="h-2.5 w-2.5 rounded-full bg-pink" /> נשאר מהימים הקודמים
          </h2>
          {overdue.map((i) => <ItemCard key={i.id} item={i} showDate />)}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3">
        <Link href={`/calendar?d=${addDays(today, 1)}`} className="card p-4">
          <p className="text-sm font-semibold text-slate-500">מחר</p>
          <p className="text-2xl font-black">{tomorrowItems.length}</p>
          <p className="text-sm text-slate-500">פריטים מתוכננים</p>
        </Link>
        <div className="card p-4">
          <p className="text-sm font-semibold text-slate-500">בקרוב</p>
          {soon.length ? (
            soon.slice(0, 2).map((u) => (
              <p key={u.label} className="mt-0.5 text-sm font-bold">
                {u.label} <span className="font-normal text-slate-500">· בעוד {u.inDays} ימים</span>
              </p>
            ))
          ) : (
            <p className="text-sm text-slate-500">אין חגים בחודש הקרוב</p>
          )}
        </div>
      </section>
    </div>
  );
}
