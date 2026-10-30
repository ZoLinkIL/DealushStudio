"use client";
import { useEffect, useState } from "react";

export function toast(msg: string) {
  window.dispatchEvent(new CustomEvent("studio-toast", { detail: msg }));
}

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), 2200);
    };
    window.addEventListener("studio-toast", on);
    return () => window.removeEventListener("studio-toast", on);
  }, []);
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-4">
      <div className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-xl">{msg}</div>
    </div>
  );
}
