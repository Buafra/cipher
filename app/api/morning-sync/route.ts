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

async function getDubaiWeather() {
  const key = process.env.WEATHER_API_KEY;

  if (!key) {
    return "🌤️ *Dubai Weather:* Weather API key missing.";
  }

  const res = await fetch(
    `https://api.weatherapi.com/v1/current.json?key=${key}&q=Dubai&aqi=no`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return "🌤️ *Dubai Weather:* Unavailable.";
  }

  const data = await res.json();

  return [
    "🌤️ *Dubai Weather*",
    `${data.current.temp_c}°C, ${data.current.condition.text}`,
    `Feels like: ${data.current.feelslike_c}°C`,
    `Humidity: ${data.current.humidity}%`,
    `Wind: ${data.current.wind_kph} km/h`,
    `Updated: ${data.current.last_updated}`,
  ].join("\n");
}

export async function GET() {
  const now = new Date();
  const weather = await getDubaiWeather();

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
    weather,
    "",
    "*Pending modules:*",
    "• AI / Tech news",
    "• Markets",
    "• Gold / Silver",
    "• BTC / ETH",
    "• DEWA stock",
    "",
    "_Morning Sync weather module active._",
  ].join("\n");

  const telegram = await sendTelegram(message);

  return NextResponse.json({
    ok: true,
    sent: true,
    telegram,
  });
}