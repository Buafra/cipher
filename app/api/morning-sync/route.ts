import { NextResponse } from "next/server";

async function sendTelegram(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error("Missing Telegram environment variables");
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    }),
  });

  if (!res.ok) {
    throw new Error("Telegram send failed");
  }

  return res.json();
}

export async function GET() {
  const now = new Date();

  const message = [
    "🌅 *Cipher Morning Sync*",
    "",
    `Date: ${now.toLocaleDateString("en-AE", {
      timeZone: "Asia/Dubai",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    "",
    "✅ Telegram delivery is active.",
    "",
    "*Today’s modules:*",
    "• AI / Tech news — pending",
    "• Markets — pending",
    "• Gold / Silver — pending",
    "• BTC / ETH — pending",
    "• Weather — pending",
    "• DEWA stock — pending",
    "",
    "_This is the first Morning Sync scaffold._",
  ].join("\n");

  const telegram = await sendTelegram(message);

  return NextResponse.json({
    ok: true,
    sent: true,
    telegram,
  });
}