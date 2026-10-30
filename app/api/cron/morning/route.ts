import { NextResponse } from "next/server";
import { buildMorningDigest } from "@/lib/digest";
import { notify } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Called by Vercel Cron every morning (see vercel.json). Vercel sends
// "Authorization: Bearer <CRON_SECRET>" automatically when CRON_SECRET is set.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const text = await buildMorningDigest();
  const r = await notify(text, "/", "פתח את מסך היום");
  return NextResponse.json({ ok: r.ok });
}
