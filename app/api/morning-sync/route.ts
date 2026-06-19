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
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) throw new Error("Telegram send failed");
  return res.json();
}

async function getDubaiWeather() {
  const key = process.env.WEATHER_API_KEY;
  if (!key) return "🌤️ *Dubai Weather:* Weather API key missing.";

  try {
    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${key}&q=Dubai&aqi=no`,
      { cache: "no-store" }
    );

    if (!res.ok) return "🌤️ *Dubai Weather:* Unavailable.";
    const data = await res.json();

    return [
      "🌤️ *Dubai Weather*",
      `${data.current.temp_c}°C, ${data.current.condition.text}`,
      `Feels like: ${data.current.feelslike_c}°C`,
      `Humidity: ${data.current.humidity}%`,
      `Wind: ${data.current.wind_kph} km/h`,
    ].join("\n");
  } catch {
    return "🌤️ *Dubai Weather:* Unavailable.";
  }
}

async function getAiTechNews() {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return "🤖 *AI + Tech News:* Tavily API key missing.";

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query:
          "latest AI and technology news OpenAI Anthropic Google Microsoft Apple NVIDIA",
        topic: "news",
        search_depth: "basic",
        max_results: 4,
        include_answer: false,
      }),
    });

    if (!res.ok) return "🤖 *AI + Tech News:* Unavailable.";
    const data = await res.json();

    if (!data.results?.length) {
      return "🤖 *AI + Tech News:* No fresh results found.";
    }

    const headlines = data.results
      .slice(0, 4)
      .map(
        (item: { title?: string }, index: number) =>
          `${index + 1}. ${item.title || "Untitled"}`
      )
      .join("\n");

    return ["🤖 *AI + Tech News*", headlines].join("\n");
  } catch {
    return "🤖 *AI + Tech News:* Unavailable.";
  }
}

async function getMetals() {
  const goldApiKey = process.env.GOLD_API_KEY ?? "";

  if (goldApiKey.length === 0) {
    return "🥇 *Gold / Silver:* GoldAPI key missing.";
  }

  async function fetchMetal(symbol: "XAU" | "XAG") {
    const res = await fetch(`https://www.goldapi.io/api/${symbol}/USD`, {
      headers: {
        "x-access-token": goldApiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  }

  try {
    const [gold, silver] = await Promise.all([
      fetchMetal("XAU"),
      fetchMetal("XAG"),
    ]);

    if (!gold && !silver) return "🥇 *Gold / Silver:* Unavailable.";

    const lines = ["🥇 *Gold / Silver*"];

    lines.push(
      gold?.price
        ? `Gold: $${Number(gold.price).toFixed(2)} / oz`
        : "Gold: unavailable"
    );

    lines.push(
      silver?.price
        ? `Silver: $${Number(silver.price).toFixed(2)} / oz`
        : "Silver: unavailable"
    );

    lines.push("Source: GoldAPI");

    return lines.join("\n");
  } catch {
    return "🥇 *Gold / Silver:* Unavailable.";
  }
}

async function getCrypto() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
      { cache: "no-store" }
    );

    if (!res.ok) return "₿ *Crypto:* Unavailable.";

    const data = await res.json();
    const btc = data.bitcoin;
    const eth = data.ethereum;

    return [
      "₿ *Crypto*",
      `BTC: $${btc.usd.toLocaleString()} (${btc.usd_24h_change.toFixed(2)}%)`,
      `ETH: $${eth.usd.toLocaleString()} (${eth.usd_24h_change.toFixed(2)}%)`,
      "Source: CoinGecko",
    ].join("\n");
  } catch {
    return "₿ *Crypto:* Unavailable.";
  }
}

async function getExchangeRates() {
  const key = process.env.EXCHANGE_RATE_API_KEY;
  if (!key) return "💱 *Exchange Rates:* API key missing.";

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${key}/latest/AED`,
      { cache: "no-store" }
    );

    if (!res.ok) return "💱 *Exchange Rates:* Unavailable.";

    const data = await res.json();

    const usd = data.conversion_rates?.USD;
    const eur = data.conversion_rates?.EUR;
    const gbp = data.conversion_rates?.GBP;
    const inr = data.conversion_rates?.INR;

    return [
      "💱 *Exchange Rates*",
      `AED → USD: ${usd}`,
      `AED → EUR: ${eur}`,
      `AED → GBP: ${gbp}`,
      `AED → INR: ${inr}`,
      "Source: ExchangeRate API",
    ].join("\n");
  } catch {
    return "💱 *Exchange Rates:* Unavailable.";
  }
}

export async function GET() {
  const now = new Date();

  const weather = await getDubaiWeather();
  const news = await getAiTechNews();
  const metals = await getMetals();
  const crypto = await getCrypto();
  const fx = await getExchangeRates();

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
    news,
    "",
    metals,
    "",
    crypto,
    "",
    fx,
    "",
    "*Pending modules:*",
    "• Markets",
    "• DEWA stock",
    "",
    "_Morning Sync weather, news, metals, crypto, and FX modules active._",
  ].join("\n");

  const telegram = await sendTelegram(message);

  return NextResponse.json({
    ok: true,
    sent: true,
    telegram,
  });
}