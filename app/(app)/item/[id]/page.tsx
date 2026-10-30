import { notFound } from "next/navigation";
import { ItemForm } from "@/components/ItemForm";
import { getItem } from "@/lib/db";

export default async function EditItem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n)) notFound();
  const item = await getItem(n);
  if (!item) notFound();
  return <ItemForm key={item.id} item={item} defaultDate={item.date} />;
}
