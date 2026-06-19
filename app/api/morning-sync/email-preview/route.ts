import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getDubaiWeather() {
  const key = process.env.WEATHER_API_KEY;
  if (!key) return { temp: "N/A", condition: "Weather key missing", feels: "N/A" };

  try {
    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${key}&q=Dubai&aqi=no`,
      { cache: "no-store" }
    );

    if (!res.ok) return { temp: "N/A", condition: "Unavailable", feels: "N/A" };

    const data = await res.json();

    return {
      temp: `${data.current.temp_c}°C`,
      condition: data.current.condition.text,
      feels: `${data.current.feelslike_c}°C`,
    };
  } catch {
    return { temp: "N/A", condition: "Unavailable", feels: "N/A" };
  }
}

async function getCrypto() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
      { cache: "no-store" }
    );

    if (!res.ok) return null;

    const data = await res.json();

    return {
      btc: `$${data.bitcoin.usd.toLocaleString()}`,
      btcChange: `${data.bitcoin.usd_24h_change.toFixed(2)}%`,
      eth: `$${data.ethereum.usd.toLocaleString()}`,
      ethChange: `${data.ethereum.usd_24h_change.toFixed(2)}%`,
    };
  } catch {
    return null;
  }
}

async function getMetals() {
  const goldApiKey: string = process.env.GOLD_API_KEY ?? "";
  if (!goldApiKey) return null;

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
    return null;
  }
}

async function getExchangeRates() {
  const key = process.env.EXCHANGE_RATE_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${key}/latest/AED`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;

    const data = await res.json();

    return {
      usd: data.conversion_rates?.USD,
      eur: data.conversion_rates?.EUR,
      gbp: data.conversion_rates?.GBP,
      inr: data.conversion_rates?.INR,
    };
  } catch {
    return null;
  }
}

async function getAiNews() {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

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

    if (!res.ok) return [];

    const data = await res.json();

    return (data.results ?? []).slice(0, 3).map((item: any) => ({
      title: item.title || "Untitled",
      source: item.url || "",
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  const now = new Date();

  const [weather, metals, crypto, fx, news] = await Promise.all([
    getDubaiWeather(),
    getMetals(),
    getCrypto(),
    getExchangeRates(),
    getAiNews(),
  ]);

  const date = now.toLocaleDateString("en-AE", {
    timeZone: "Asia/Dubai",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Cipher Executive Morning Brief</title>
</head>
<body style="margin:0;background:#080b10;font-family:Arial,Helvetica,sans-serif;color:#f6f0df;">
  <div style="max-width:900px;margin:0 auto;padding:28px;">
    <div style="border:1px solid rgba(214,181,109,.35);border-radius:28px;background:linear-gradient(135deg,#111827,#05070a);overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.45);">

      <div style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,.10);display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="letter-spacing:4px;color:#d6b56d;font-size:12px;font-weight:bold;">CIPHER</div>
          <h1 style="margin:8px 0 0;font-size:34px;font-weight:400;">Executive Morning Brief</h1>
          <p style="margin:8px 0 0;color:#aab0bd;font-size:14px;">Private intelligence for Faisal Buafra</p>
        </div>
        <div style="text-align:right;color:#aab0bd;font-size:13px;line-height:1.6;">
          ${date}<br/>
          UAE Time
        </div>
      </div>

      <div style="padding:28px 32px;">
        <div style="background:rgba(214,181,109,.10);border:1px solid rgba(214,181,109,.25);border-radius:22px;padding:20px;">
          <div style="font-size:12px;letter-spacing:3px;color:#d6b56d;font-weight:bold;">CIPHER VERDICT</div>
          <p style="margin:14px 0 8px;font-size:16px;line-height:1.6;"><b>Key Insight:</b> Morning Sync is now active across weather, AI news, metals, crypto, and FX. This is the first working intelligence layer of Cipher.</p>
          <p style="margin:8px 0;font-size:16px;line-height:1.6;"><b>One Action:</b> Confirm the 7:00 AM automated Telegram delivery tomorrow, then add markets and DEWA stock.</p>
          <p style="margin:8px 0 0;font-size:16px;line-height:1.6;"><b>One Risk:</b> Expanding too fast before the daily workflow proves stable. Keep this version reliable first.</p>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:20px;">
          <div style="background:rgba(255,255,255,.06);border-radius:18px;padding:16px;">
            <div style="color:#aab0bd;font-size:12px;">Dubai Weather</div>
            <div style="font-size:22px;margin-top:6px;">${weather.temp}</div>
            <div style="color:#aab0bd;font-size:13px;">${weather.condition}</div>
          </div>

          <div style="background:rgba(255,255,255,.06);border-radius:18px;padding:16px;">
            <div style="color:#aab0bd;font-size:12px;">Gold</div>
            <div style="font-size:22px;margin-top:6px;">${metals?.gold ?? "N/A"}</div>
            <div style="color:#aab0bd;font-size:13px;">per oz</div>
          </div>

          <div style="background:rgba(255,255,255,.06);border-radius:18px;padding:16px;">
            <div style="color:#aab0bd;font-size:12px;">Silver</div>
            <div style="font-size:22px;margin-top:6px;">${metals?.silver ?? "N/A"}</div>
            <div style="color:#aab0bd;font-size:13px;">per oz</div>
          </div>

          <div style="background:rgba(255,255,255,.06);border-radius:18px;padding:16px;">
            <div style="color:#aab0bd;font-size:12px;">Bitcoin</div>
            <div style="font-size:22px;margin-top:6px;">${crypto?.btc ?? "N/A"}</div>
            <div style="color:#aab0bd;font-size:13px;">${crypto?.btcChange ?? ""}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px;">
          <div style="background:rgba(255,255,255,.055);border-radius:22px;padding:20px;">
            <div style="font-size:12px;letter-spacing:3px;color:#d6b56d;font-weight:bold;">CRYPTO</div>
            <p style="line-height:1.7;color:#c7cbd3;margin:12px 0 0;">
              BTC: ${crypto?.btc ?? "N/A"} (${crypto?.btcChange ?? "N/A"})<br/>
              ETH: ${crypto?.eth ?? "N/A"} (${crypto?.ethChange ?? "N/A"})<br/>
              Source: CoinGecko
            </p>
          </div>

          <div style="background:rgba(255,255,255,.055);border-radius:22px;padding:20px;">
            <div style="font-size:12px;letter-spacing:3px;color:#d6b56d;font-weight:bold;">FX SNAPSHOT</div>
            <p style="line-height:1.7;color:#c7cbd3;margin:12px 0 0;">
              AED → USD: ${fx?.usd ?? "N/A"}<br/>
              AED → EUR: ${fx?.eur ?? "N/A"}<br/>
              AED → GBP: ${fx?.gbp ?? "N/A"}<br/>
              AED → INR: ${fx?.inr ?? "N/A"}
            </p>
          </div>
        </div>

        <div style="margin-top:22px;background:rgba(255,255,255,.055);border-radius:22px;padding:20px;">
          <div style="font-size:12px;letter-spacing:3px;color:#d6b56d;font-weight:bold;">AI & TECHNOLOGY INTELLIGENCE</div>

          ${
            news.length
              ? news
                  .map(
                    (item: any, index: number) => `
          <div style="margin-top:16px;border-bottom:1px solid rgba(255,255,255,.10);padding-bottom:14px;">
            <h3 style="margin:0;font-size:17px;">${index + 1}. ${item.title}</h3>
            <p style="margin:8px 0 0;color:#c7cbd3;line-height:1.5;"><b>Why it matters:</b> This may affect AI platforms, cloud providers, model access, or enterprise adoption.</p>
            <p style="margin:6px 0 0;color:#c7cbd3;line-height:1.5;"><b>Cipher impact:</b> Track whether this changes your model routing, local AI roadmap, or automation priorities.</p>
          </div>`
                  )
                  .join("")
              : `<p style="color:#c7cbd3;">No AI news available.</p>`
          }
        </div>

        <div style="margin-top:22px;background:rgba(255,255,255,.055);border-radius:22px;padding:20px;">
          <div style="font-size:12px;letter-spacing:3px;color:#d6b56d;font-weight:bold;">FAISAL FOCUS</div>
          <p style="line-height:1.7;color:#c7cbd3;margin:12px 0 0;">
            1. Confirm 7 AM Morning Sync automation delivery<br/>
            2. Add markets and DEWA stock next<br/>
            3. Convert this HTML view into a 1-page PDF and email attachment
          </p>
        </div>

        <div style="margin-top:22px;text-align:center;color:#747b88;font-size:12px;">
          Generated by Cipher OS · Private Executive Intelligence System
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}