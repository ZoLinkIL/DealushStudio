import { auth, signOut, allowedEmails } from "@/auth";
import { TelegramButtons } from "@/components/TelegramButtons";
import { studioUrl } from "@/lib/telegram";

function Row({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black ${ok ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
        {ok ? "✓" : "!"}
      </span>
      <div>
        <p className="font-bold">{label}</p>
        {!ok && <p className="text-sm text-slate-500">{hint}</p>}
      </div>
    </li>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  const e = process.env;
  const base = studioUrl() || "https://studio.dealush.co.il";

  return (
    <div className="mx-auto max-w-2xl space-y-4 pt-1">
      <h1 className="text-2xl font-black">הגדרות</h1>

      <div className="card p-4">
        <p className="text-sm text-slate-500">מחובר כ-</p>
        <p className="font-bold" dir="ltr">{session?.user?.email}</p>
        <p className="mt-1 text-xs text-slate-400">כניסה מורשית רק ל: {allowedEmails().length} כתובת/ות</p>
        <form
          className="mt-3"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="btn btn-ghost w-full">התנתקות</button>
        </form>
      </div>

      <div className="card p-4">
        <h2 className="font-black">חיבורים</h2>
        <ul className="divide-y divide-slate-100">
          <Row ok={!!e.DATABASE_URL} label="בסיס נתונים (Neon)" hint="Vercel → Storage → Neon, ואז Redeploy" />
          <Row ok={!!e.BLOB_READ_WRITE_TOKEN} label="אחסון קבצים (Blob)" hint="Vercel → Storage → Blob, ואז Redeploy" />
          <Row ok={!!e.TELEGRAM_BOT_TOKEN && !!e.TELEGRAM_CHAT_ID} label="בוט טלגרם אישי" hint="TELEGRAM_BOT_TOKEN ו-TELEGRAM_CHAT_ID" />
          <Row ok={!!e.TELEGRAM_WEBHOOK_SECRET} label="פקודות בבוט (/today)" hint="TELEGRAM_WEBHOOK_SECRET" />
          <Row ok={!!e.CRON_SECRET} label="התראת בוקר" hint="CRON_SECRET" />
          <Row ok={(e.STUDIO_API_KEY ?? "").length >= 24} label="מפתח API לתוכן מ-Claude" hint="STUDIO_API_KEY (לפחות 24 תווים)" />
        </ul>
      </div>

      <div className="card space-y-3 p-4">
        <h2 className="font-black">טלגרם</h2>
        <p className="text-sm text-slate-500">
          כל בוקר מגיעה הודעה עם מה שעולה היום. בנוסף מגיעה הודעה בכל פעם שנוסף פריט מוכן מ-Claude. אפשר לשלוח לבוט /today, /tomorrow או /week.
        </p>
        <TelegramButtons />
      </div>

      <div className="card p-4">
        <h2 className="font-black">הוספת תוכן מבחוץ (API)</h2>
        <p className="mt-1 text-sm text-slate-500">כך Claude מעלה תוכן מוכן ישר ללוח:</p>
        <pre dir="ltr" className="mt-2 overflow-x-auto rounded-xl bg-ink p-3 text-left text-xs leading-relaxed text-blue-100">{`POST ${base}/api/items
Authorization: Bearer <STUDIO_API_KEY>
{
  "title": "...", "platform": "ig_post",
  "date": "2026-11-02", "time": "19:00",
  "caption": "...", "hashtags": "#דילוש",
  "images": [{ "name": "post.png", "base64": "..." }]
}`}</pre>
      </div>
    </div>
  );
}
