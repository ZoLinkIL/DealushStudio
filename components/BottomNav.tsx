"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const I = {
  today: (
    <path d="M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
  ),
  cal: <path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 8h2m3 0h2m-7 4h2m3 0h2" />,
  tpl: <path d="M4 5h7v6H4zM13 5h7v3h-7zM13 10h7v9h-7zM4 13h7v6H4z" />,
  set: (
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4.9a7.5 7.5 0 0 0-2-1.2L14.5 3h-4l-.4 2.5a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.5 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-.9a7.5 7.5 0 0 0 2 1.2l.4 2.5h4l.4-2.5a7.5 7.5 0 0 0 2-1.2l2.4.9 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" />
  ),
};

function Tab({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-bold ${active ? "text-brand" : "text-slate-400"}`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      {label}
    </Link>
  );
}

export function BottomNav() {
  const p = usePathname();
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-end px-2 pt-1">
        <Tab href="/" label="היום" icon={I.today} active={p === "/"} />
        <Tab href="/calendar" label="לוח" icon={I.cal} active={p.startsWith("/calendar")} />
        <Link
          href="/item/new"
          aria-label="פריט חדש"
          className="mx-2 -mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/40 active:scale-95"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
        <Tab href="/templates" label="תבניות" icon={I.tpl} active={p.startsWith("/templates")} />
        <Tab href="/settings" label="הגדרות" icon={I.set} active={p.startsWith("/settings")} />
      </div>
    </nav>
  );
}
