"use client";
import { useTransition } from "react";
import { telegramTestAction, telegramWebhookAction } from "@/app/actions";
import { toast } from "./Toast";

export function TelegramButtons() {
  const [pending, start] = useTransition();
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        className="btn btn-soft text-sm"
        disabled={pending}
        onClick={() => start(async () => toast((await telegramTestAction()).message))}
      >
        שלח הודעת בדיקה
      </button>
      <button
        className="btn btn-soft text-sm"
        disabled={pending}
        onClick={() => start(async () => toast((await telegramWebhookAction(location.origin)).message))}
      >
        חבר פקודות לבוט
      </button>
    </div>
  );
}
