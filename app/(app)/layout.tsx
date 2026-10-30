import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "@/components/Toast";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-28">
      <header className="safe-top sticky top-0 z-20 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-3">
          <img src="/icons/icon-192.png" alt="" className="h-9 w-9 rounded-xl" />
          <span className="text-lg font-black tracking-tight">סטודיו דילוש</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4">{children}</main>
      <BottomNav />
      <Toaster />
    </div>
  );
}
