import { platformOf, statusOf } from "@/lib/constants";

export function PlatformBadge({ id, short = false }: { id: string; short?: boolean }) {
  const p = platformOf(id);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold text-white"
      style={{ background: p.color }}
    >
      <span aria-hidden>{p.emoji}</span>
      {short ? p.short : p.label}
    </span>
  );
}

export function StatusBadge({ id }: { id: string }) {
  const s = statusOf(id);
  return (
    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-bold" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}
