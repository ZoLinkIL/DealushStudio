import { listItems } from "@/lib/db";
import { addDays, daysInMonth, isValidDate, startOfMonth, startOfWeek, todayIL } from "@/lib/dates";
import { marksBetween, type DayMark } from "@/lib/calendar";
import { CalendarView } from "@/components/CalendarView";
import { SetupNotice } from "@/components/SetupNotice";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; view?: string }>;
}) {
  if (!process.env.DATABASE_URL) return <SetupNotice />;
  const sp = await searchParams;
  const today = todayIL();
  const anchor = isValidDate(sp.d) ? sp.d : today;
  const view = sp.view === "month" ? "month" : "week";

  let from: string, to: string;
  if (view === "week") {
    from = startOfWeek(anchor);
    to = addDays(from, 6);
  } else {
    const m = startOfMonth(anchor);
    from = startOfWeek(m);
    const last = addDays(m, daysInMonth(m) - 1);
    to = addDays(startOfWeek(last), 6);
  }

  const items = await listItems(from, to);
  const marks: Record<string, DayMark[]> = Object.fromEntries(marksBetween(from, to));

  return <CalendarView view={view} anchor={anchor} from={from} to={to} today={today} items={items} marks={marks} />;
}
