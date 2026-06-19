import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

async function sendEmail(subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.MORNING_EMAIL_TO;
  const from = process.env.MORNING_EMAIL_FROM;

  if (!apiKey || !to || !from) return null;

  const resend = new Resend(apiKey);

  return resend.emails.send({
    from,
    to,
    subject,
    html,
  });
}

async function getDubaiWeather() {
  const key = process.env.WEATHER_API_KEY;
  if (!key) return "Weather key missing";

  try {
    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${key}&q=Dubai&aqi=no`,
      { cache: "no-store" }
    );

    if (!res.ok) return "Unavailable";
    const data = await res.json();

    return `${data.current.temp_c}°C, ${data.current.condition.text} — feels like ${data.current.feelslike_c}°C`;
  } catch {
    return "Unavailable";
  }
}

async function getAiTechNews() {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return ["AI news unavailable"];

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query:
          "latest AI and technology news today OpenAI Anthropic Google Microsoft Apple NVIDIA",
        topic: "news",
        search_depth: "basic",
        max_results: 4,
        include_answer: false,
      }),
    });

    if (!res.ok) return ["AI news unavailable"];
    const data = await res.json();

    return (data.results ?? [])
      .slice(0, 4)
      .map((item: { title?: string }) => item.title || "Untitled");
  } catch {
    return ["AI news unavailable"];
  }
}

async function getMetals() {
  const goldApiKey: string = process.env.GOLD_API_KEY ?? "";
  if (!goldApiKey) return { gold: "N/A", silver: "N/A" };

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

    return {
      gold: gold?.price ? `$${Number(gold.price).toFixed(2)}` : "N/A",
      silver: silver?.price ? `$${Number(silver.price).toFixed(2)}` : "N/A",
    };
  } catch {
    return { gold: "N/A", silver: "N/A" };
  }
}

async function getCrypto() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
      { cache: "no-store" }
    );

    if (!res.ok) return { btc: "N/A", eth: "N/A" };

    const data = await res.json();

    return {
      btc: `$${data.bitcoin.usd.toLocaleString()} (${data.bitcoin.usd_24h_change.toFixed(2)}%)`,
      eth: `$${data.ethereum.usd.toLocaleString()} (${data.ethereum.usd_24h_change.toFixed(2)}%)`,
    };
  } catch {
    return { btc: "N/A", eth: "N/A" };
  }
}

async function getExchangeRates() {
  const key = process.env.EXCHANGE_RATE_API_KEY;
  if (!key) return { usd: "N/A", eur: "N/A", gbp: "N/A", inr: "N/A" };

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${key}/latest/AED`,
      { cache: "no-store" }
    );

    if (!res.ok) return { usd: "N/A", eur: "N/A", gbp: "N/A", inr: "N/A" };

    const data = await res.json();

    return {
      usd: data.conversion_rates?.USD ?? "N/A",
      eur: data.conversion_rates?.EUR ?? "N/A",
      gbp: data.conversion_rates?.GBP ?? "N/A",
      inr: data.conversion_rates?.INR ?? "N/A",
    };
  } catch {
    return { usd: "N/A", eur: "N/A", gbp: "N/A", inr: "N/A" };
  }
}

function buildEmailHtml({
  date,
  weather,
  news,
  metals,
  crypto,
  fx,
}: {
  date: string;
  weather: string;
  news: string[];
  metals: { gold: string; silver: string };
  crypto: { btc: string; eth: string };
  fx: {
    usd: string | number;
    eur: string | number;
    gbp: string | number;
    inr: string | number;
  };
}) {
  const shortNews = news.slice(0, 3);

  const newsHtml = shortNews
    .map(
      (title, index) => `
        <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.10);">
          <div style="font-size:16px;font-weight:bold;color:#fff;">
            ${index + 1}. ${title}
          </div>
          <div style="margin-top:5px;font-size:13px;line-height:1.45;color:#c7cbd3;">
            <b>Why it matters:</b> Relevant to AI platforms, chips, cloud, or automation.
          </div>
          <div style="margin-top:3px;font-size:13px;line-height:1.45;color:#c7cbd3;">
            <b>Cipher impact:</b> Monitor for model routing or Morning Sync improvements.
          </div>
        </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<body style="margin:0;background:#070b10;font-family:Arial,Helvetica,sans-serif;color:#f6f0df;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070b10;padding:18px 0;">
    <tr>
      <td align="center">
        <table width="760" cellpadding="0" cellspacing="0" style="background:#0d121c;border:1px solid rgba(214,181,109,.35);border-radius:26px;overflow:hidden;">
          <tr>
            <td style="padding:26px 34px;border-bottom:1px solid rgba(255,255,255,.10);">
              <table width="100%">
                <tr>
                  <td>
                    <div style="letter-spacing:6px;color:#d6b56d;font-size:13px;font-weight:bold;">CIPHER</div>
                    <div style="font-size:34px;line-height:1.1;margin-top:8px;color:#fff;">Executive Morning Brief</div>
                    <div style="font-size:15px;color:#cbd5e1;margin-top:8px;">Private intelligence for Faisal Buafra</div>
                  </td>
                  <td align="right" style="font-size:15px;line-height:1.6;color:#cbd5e1;">
                    ${date}<br/>
                    07:00 UAE
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 34px;">
              <div style="background:#242426;border:1px solid rgba(214,181,109,.30);border-radius:22px;padding:20px;">
                <div style="letter-spacing:5px;color:#d6b56d;font-size:13px;font-weight:bold;">CIPHER VERDICT</div>
                <p style="font-size:16px;line-height:1.55;color:#fff;margin:14px 0 7px;"><b>Key Insight:</b> Morning Sync is active across weather, AI news, metals, crypto, and FX.</p>
                <p style="font-size:16px;line-height:1.55;color:#fff;margin:7px 0;"><b>One Action:</b> Confirm today’s delivery, then add markets and DEWA stock next.</p>
                <p style="font-size:16px;line-height:1.55;color:#fff;margin:7px 0 0;"><b>One Risk:</b> Expanding too fast before the daily workflow is stable.</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
                <tr>
                  <td width="25%" style="padding:6px;">
                    <div style="background:#171d28;border-radius:16px;padding:14px;height:78px;">
                      <div style="color:#cbd5e1;font-size:12px;">Dubai Weather</div>
                      <div style="font-size:19px;color:#fff;margin-top:6px;">${weather}</div>
                    </div>
                  </td>
                  <td width="25%" style="padding:6px;">
                    <div style="background:#171d28;border-radius:16px;padding:14px;height:78px;">
                      <div style="color:#cbd5e1;font-size:12px;">Gold</div>
                      <div style="font-size:23px;color:#fff;margin-top:6px;">${metals.gold}</div>
                      <div style="color:#cbd5e1;font-size:12px;">per oz</div>
                    </div>
                  </td>
                  <td width="25%" style="padding:6px;">
                    <div style="background:#171d28;border-radius:16px;padding:14px;height:78px;">
                      <div style="color:#cbd5e1;font-size:12px;">Silver</div>
                      <div style="font-size:23px;color:#fff;margin-top:6px;">${metals.silver}</div>
                      <div style="color:#cbd5e1;font-size:12px;">per oz</div>
                    </div>
                  </td>
                  <td width="25%" style="padding:6px;">
                    <div style="background:#171d28;border-radius:16px;padding:14px;height:78px;">
                      <div style="color:#cbd5e1;font-size:12px;">BTC / ETH</div>
                      <div style="font-size:17px;color:#fff;margin-top:6px;">${crypto.btc}</div>
                      <div style="color:#cbd5e1;font-size:12px;">ETH: ${crypto.eth}</div>
                    </div>
                  </td>
                </tr>
              </table>

              <div style="margin-top:18px;background:#171d28;border-radius:22px;padding:20px;">
                <div style="letter-spacing:5px;color:#d6b56d;font-size:13px;font-weight:bold;">AI & TECHNOLOGY INTELLIGENCE</div>
                ${newsHtml}
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
                <tr>
                  <td width="50%" style="padding:6px;">
                    <div style="background:#171d28;border-radius:20px;padding:18px;">
                      <div style="letter-spacing:5px;color:#d6b56d;font-size:13px;font-weight:bold;">FX SNAPSHOT</div>
                      <div style="font-size:16px;line-height:1.7;color:#d7deea;margin-top:12px;">
                        AED → USD: ${fx.usd}<br/>
                        AED → EUR: ${fx.eur}<br/>
                        AED → GBP: ${fx.gbp}<br/>
                        AED → INR: ${fx.inr}
                      </div>
                    </div>
                  </td>
                  <td width="50%" style="padding:6px;">
                    <div style="background:#171d28;border-radius:20px;padding:18px;">
                      <div style="letter-spacing:5px;color:#d6b56d;font-size:13px;font-weight:bold;">FAISAL FOCUS</div>
                      <div style="font-size:16px;line-height:1.7;color:#d7deea;margin-top:12px;">
                        1. Confirm 7 AM automation<br/>
                        2. Add markets + DEWA stock<br/>
                        3. Keep Cipher stable
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <div style="text-align:center;color:#7c8798;font-size:12px;margin-top:22px;">
                Generated by Cipher OS · Private Executive Intelligence System
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
export async function GET() {
  const now = new Date();

  const date = now.toLocaleDateString("en-AE", {
    timeZone: "Asia/Dubai",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [weather, news, metals, crypto, fx] = await Promise.all([
    getDubaiWeather(),
    getAiTechNews(),
    getMetals(),
    getCrypto(),
    getExchangeRates(),
  ]);

  const telegramMessage = [
    "🌅 *Cipher Morning Sync*",
    "",
    `Date: ${date}`,
    "",
    `🌤️ *Dubai Weather*\n${weather}`,
    "",
    `🤖 *AI + Tech News*\n${news.map((n: string, i: number) => `${i + 1}. ${n}`).join("\n")}`,
    "",
    `🥇 *Gold / Silver*\nGold: ${metals.gold}\nSilver: ${metals.silver}`,
    "",
    `₿ *Crypto*\nBTC: ${crypto.btc}\nETH: ${crypto.eth}`,
    "",
    `💱 *Exchange Rates*\nAED → USD: ${fx.usd}\nAED → EUR: ${fx.eur}\nAED → GBP: ${fx.gbp}\nAED → INR: ${fx.inr}`,
  ].join("\n");

  const html = buildEmailHtml({ date, weather, news, metals, crypto, fx });

  const [telegram, email] = await Promise.all([
    sendTelegram(telegramMessage),
    sendEmail(`Cipher Morning Briefing — ${date}`, html),
  ]);

  return NextResponse.json({
    ok: true,
    sent: true,
    telegram,
    email,

  });
}