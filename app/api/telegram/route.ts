import { NextResponse } from "next/server";
import { buildDayList, buildMorningDigest, buildWeekList } from "@/lib/digest";
import { addDays, todayIL } from "@/lib/dates";
import { tg } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Webhook for your personal Telegram bot. It answers ONLY your chat
// (TELEGRAM_CHAT_ID). Anyone else gets their chat id at most, nothing from the studio.
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const update = await req.json().catch(() => null);
  const msg = update?.message;
  if (!msg?.chat?.id) return NextResponse.json({ ok: true });

  const chatId = String(msg.chat.id);
  const owner = process.env.TELEGRAM_CHAT_ID;
  const text: string = (msg.text ?? "").trim();
  const reply = (t: string) =>
    tg("sendMessage", { chat_id: chatId, text: t, parse_mode: "HTML", disable_web_page_preview: true });

  if (!owner || chatId !== owner) {
    if (text.startsWith("/start") || text.startsWith("/id")) {
      await reply(`זה בוט פרטי.\nה-Chat ID שלך: <code>${chatId}</code>`);
    }
    return NextResponse.json({ ok: true });
  }

  const today = todayIL();
  const cmd = text.split(/[\s@]/)[0].toLowerCase();
  if (cmd === "/today" || cmd === "/start" || text === "היום") await reply(await buildMorningDigest(today));
  else if (cmd === "/tomorrow" || text === "מחר") await reply(await buildDayList(addDays(today, 1), "מחר"));
  else if (cmd === "/week" || text === "שבוע") await reply(await buildWeekList(today));
  else await reply("פקודות: /today · /tomorrow · /week");

  return NextResponse.json({ ok: true });
}
