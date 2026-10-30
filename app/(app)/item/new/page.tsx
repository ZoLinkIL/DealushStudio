import { ItemForm } from "@/components/ItemForm";
import { isValidDate, todayIL } from "@/lib/dates";

export default async function NewItem({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  return <ItemForm item={null} defaultDate={isValidDate(d) ? d : todayIL()} />;
}
