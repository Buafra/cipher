import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value: unknown, decimals = 4) {
  if (typeof value === "number") return value.toFixed(decimals);
  return String(value ?? "N/A");
}

function cleanNewsItem(text: string) {
  return text
    .replace(/^[-–—\s]+/gm, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^(\d+\.\s*)/gm, "")
    .replace(/Cipher Intelligence Brief/gi, "")
    .replace(/Prepared for Faisal Buafra/gi, "")
    .replace(/Executive Intelligence/gi, "")
    .replace(/Confidential/gi, "")
    .replace(/-{3,}/g, "")
    .trim();
}

function parseNewsItem(item: string) {
  const lines = item
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const headline =
    lines.find(
      (x) =>
        !x.toLowerCase().startsWith("why it matters:") &&
        !x.toLowerCase().startsWith("cipher impact:")
    ) ?? "AI news update";

  const why =
    lines.find((x) => x.toLowerCase().startsWith("why it matters:")) ??
    "Why it matters: Relevant to AI strategy and enterprise technology.";

  const impact =
    lines.find((x) => x.toLowerCase().startsWith("cipher impact:")) ??
    "Cipher impact: Monitor for model routing, local AI, or automation improvements.";

  return { headline, why, impact };
}

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
      text: message.slice(0, 3900),
      parse_mode: "HTML",
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
  const tavilyKey = process.env.TAVILY_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!tavilyKey) return ["AI news unavailable"];

  try {
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query:
          "latest important AI and technology news today OpenAI Anthropic Google Microsoft Apple NVIDIA enterprise AI chips agents regulation",
        topic: "news",
        search_depth: "basic",
        max_results: 6,
        include_answer: false,
      }),
      cache: "no-store",
    });

    if (!searchRes.ok) return ["AI news unavailable"];

    const searchData = await searchRes.json();

    const articles = (searchData.results ?? [])
      .slice(0, 4)
      .map((item: { title?: string; url?: string; content?: string }) => ({
        title: item.title || "Untitled",
        url: item.url || "",
        content: item.content || "",
      }));

    if (!articles.length) return ["No fresh AI news found"];

    if (!anthropicKey) {
      return articles.map((a: { title: string }) => a.title).slice(0, 4);
    }

    const prompt = `
You are Cipher, Faisal Buafra's private executive intelligence analyst.

Summarize the AI and technology news below for Faisal.

Faisal cares about:
- AI strategy
- Cipher development
- model routing
- local AI
- enterprise AI
- utilities, DEWA, strategy, risk, resilience
- executive-level impact

Rules:
Return ONLY the news items.
Do not add a title.
Do not add a date.
Do not add intro.
Do not add footer.
Do not say "Cipher Intelligence Brief".
Do not mention confidential.
Do not include article URLs.
Do not use hype.
Do not use generic filler.
Keep it concise, executive, and practical.

For each item, use exactly this format:

First line: headline only, maximum 12 words. Do not write "Headline:".
Second line: Why it matters: maximum 18 words.
Third line: Cipher impact: maximum 18 words.

Separate each item using this exact separator:
---ITEM---

Articles:
${articles
  .map(
    (a: { title: string; url: string; content: string }, i: number) =>
      `${i + 1}. ${a.title}\n${a.content}\n${a.url}`
  )
  .join("\n\n")}
`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.CIPHER_MODEL ?? "claude-sonnet-4-6",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
      cache: "no-store",
    });

    if (!claudeRes.ok) {
      return articles.map((a: { title: string }) => a.title).slice(0, 4);
    }

    const claudeData = await claudeRes.json();
    const text = claudeData.content?.[0]?.text;

    if (!text) return articles.map((a: { title: string }) => a.title).slice(0, 4);

    const items = text
      .split("---ITEM---")
      .map(cleanNewsItem)
      .filter(Boolean)
      .slice(0, 4);

    return items.length ? items : articles.map((a: { title: string }) => a.title).slice(0, 4);
  } catch {
    return ["AI news unavailable"];
  }
}

async function getMetals() {
  const goldApiKey = process.env.GOLD_API_KEY ?? "";
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
  const newsHtml = news
    .slice(0, 4)
    .map((item) => {
      const parsed = parseNewsItem(item);

      return `
        <div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,.10);">
          <div style="font-size:17px;font-weight:700;color:#fff;line-height:1.35;">
            ${escapeHtml(parsed.headline)}
          </div>
          <div style="margin-top:7px;font-size:14px;line-height:1.5;color:#c7cbd3;">
            <b style="color:#d6b56d;">Why it matters:</b>
            ${escapeHtml(parsed.why.replace(/^Why it matters:\s*/i, ""))}
          </div>
          <div style="margin-top:5px;font-size:14px;line-height:1.5;color:#c7cbd3;">
            <b style="color:#d6b56d;">Cipher impact:</b>
            ${escapeHtml(parsed.impact.replace(/^Cipher impact:\s*/i, ""))}
          </div>
        </div>`;
    })
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
                    ${escapeHtml(date)}<br/>
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
                <p style="font-size:16px;line-height:1.55;color:#fff;margin:7px 0;"><b>One Action:</b> Keep the workflow stable, then add markets and DEWA stock carefully.</p>
                <p style="font-size:16px;line-height:1.55;color:#fff;margin:7px 0 0;"><b>One Risk:</b> Too many new data sources before reliability is fully proven.</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
                <tr>
                  <td width="25%" style="padding:6px;">
                    <div style="background:#171d28;border-radius:16px;padding:14px;height:88px;">
                      <div style="color:#cbd5e1;font-size:12px;">Dubai Weather</div>
                      <div style="font-size:17px;color:#fff;margin-top:6px;line-height:1.35;">${escapeHtml(weather)}</div>
                    </div>
                  </td>
                  <td width="25%" style="padding:6px;">
                    <div style="background:#171d28;border-radius:16px;padding:14px;height:88px;">
                      <div style="color:#cbd5e1;font-size:12px;">Gold</div>
                      <div style="font-size:23px;color:#fff;margin-top:6px;">${escapeHtml(metals.gold)}</div>
                      <div style="color:#cbd5e1;font-size:12px;">per oz</div>
                    </div>
                  </td>
                  <td width="25%" style="padding:6px;">
                    <div style="background:#171d28;border-radius:16px;padding:14px;height:88px;">
                      <div style="color:#cbd5e1;font-size:12px;">Silver</div>
                      <div style="font-size:23px;color:#fff;margin-top:6px;">${escapeHtml(metals.silver)}</div>
                      <div style="color:#cbd5e1;font-size:12px;">per oz</div>
                    </div>
                  </td>
                  <td width="25%" style="padding:6px;">
                    <div style="background:#171d28;border-radius:16px;padding:14px;height:88px;">
                      <div style="color:#cbd5e1;font-size:12px;">BTC / ETH</div>
                      <div style="font-size:15px;color:#fff;margin-top:6px;line-height:1.35;">BTC: ${escapeHtml(crypto.btc)}</div>
                      <div style="color:#cbd5e1;font-size:12px;">ETH: ${escapeHtml(crypto.eth)}</div>
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
                        AED → USD: ${escapeHtml(formatNumber(fx.usd))}<br/>
                        AED → EUR: ${escapeHtml(formatNumber(fx.eur))}<br/>
                        AED → GBP: ${escapeHtml(formatNumber(fx.gbp))}<br/>
                        AED → INR: ${escapeHtml(formatNumber(fx.inr))}
                      </div>
                    </div>
                  </td>
                  <td width="50%" style="padding:6px;">
                    <div style="background:#171d28;border-radius:20px;padding:18px;">
                      <div style="letter-spacing:5px;color:#d6b56d;font-size:13px;font-weight:bold;">FAISAL FOCUS</div>
                      <div style="font-size:16px;line-height:1.7;color:#d7deea;margin-top:12px;">
                        1. Confirm daily delivery<br/>
                        2. Keep news executive-level<br/>
                        3. Add new sources carefully
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

  const telegramNews = news
    .slice(0, 4)
.map((item: string, index: number) => {      const parsed = parseNewsItem(item);

      return [
        `<b>${index + 1}. ${escapeHtml(parsed.headline)}</b>`,
        `<b>Why it matters:</b> ${escapeHtml(
          parsed.why.replace(/^Why it matters:\s*/i, "")
        )}`,
        `<b>Cipher impact:</b> ${escapeHtml(
          parsed.impact.replace(/^Cipher impact:\s*/i, "")
        )}`,
      ].join("\n");
    })
    .join("\n\n");

  const telegramMessage = [
    "🌅 <b>Cipher Morning Sync</b>",
    "",
    `Date: ${escapeHtml(date)}`,
    "",
    `🌤️ <b>Dubai Weather</b>\n${escapeHtml(weather)}`,
    "",
    `🤖 <b>AI + Tech News</b>\n${telegramNews}`,
    "",
    `🥇 <b>Gold / Silver</b>\nGold: ${escapeHtml(metals.gold)}\nSilver: ${escapeHtml(metals.silver)}`,
    "",
    `₿ <b>Crypto</b>\nBTC: ${escapeHtml(crypto.btc)}\nETH: ${escapeHtml(crypto.eth)}`,
    "",
    `💱 <b>Exchange Rates</b>\nAED → USD: ${escapeHtml(formatNumber(fx.usd))}\nAED → EUR: ${escapeHtml(formatNumber(fx.eur))}\nAED → GBP: ${escapeHtml(formatNumber(fx.gbp))}\nAED → INR: ${escapeHtml(formatNumber(fx.inr))}`,
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