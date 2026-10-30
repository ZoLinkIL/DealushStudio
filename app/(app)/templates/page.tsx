import { listTemplates } from "@/lib/db";
import { startOfWeek, todayIL, addDays } from "@/lib/dates";
import { TemplatesView } from "@/components/TemplatesView";
import { SetupNotice } from "@/components/SetupNotice";

export default async function TemplatesPage() {
  if (!process.env.DATABASE_URL) return <SetupNotice />;
  const templates = await listTemplates();
  const thisWeek = startOfWeek(todayIL());
  return <TemplatesView templates={templates} thisWeek={thisWeek} nextWeek={addDays(thisWeek, 7)} />;
}
