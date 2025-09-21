// src/services/prices.js
// Smart price loaders for SPY (S&P 500 ETF):
// 1) Finnhub (candles) -> 2) Alpha Vantage -> 3) Stooq CSV (no key)

const FINN_KEY = process.env.REACT_APP_FINNHUB_KEY;
const FINN_BASE = "https://finnhub.io/api/v1";

const AV_KEY = process.env.REACT_APP_ALPHA_VANTAGE_KEY;
const AV_BASE = "https://www.alphavantage.co/query";

const nowSec = () => Math.floor(Date.now() / 1000);

// ---------- FINNHUB ----------
export async function fetchSPYQuote() {
  if (!FINN_KEY) throw new Error("Missing REACT_APP_FINNHUB_KEY");
  const url = `${FINN_BASE}/quote?symbol=SPY&token=${FINN_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (typeof json.c === "number") return json;
  throw new Error("Unexpected Finnhub /quote response");
}

async function fetchSPYDailyFinnhub(days = 120) {
  if (!FINN_KEY) throw new Error("Missing REACT_APP_FINNHUB_KEY");
  const to = nowSec();
  const from = to - days * 24 * 60 * 60;
  const url = `${FINN_BASE}/stock/candle?symbol=SPY&resolution=D&from=${from}&to=${to}&token=${FINN_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Finnhub candles failed: HTTP ${res.status} ${text}`.trim());
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  if (json.s !== "ok" || !Array.isArray(json.t)) {
    const err = new Error(json.error || json.s || "Unexpected Finnhub response");
    err.status = 400;
    throw err;
  }
  return json.t.map((ts, i) => {
    const d = new Date(ts * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return { date: `${yyyy}-${mm}-${dd}`, close: Number(json.c[i]) };
  });
}

// ---------- ALPHA VANTAGE (fallback, FREE endpoint) ----------
async function fetchSPYDailyAlphaVantage() {
  if (!AV_KEY) throw new Error("Missing REACT_APP_ALPHA_VANTAGE_KEY");

  // Use the FREE endpoint instead of DAILY_ADJUSTED
  const url = `${AV_BASE}?function=TIME_SERIES_DAILY&symbol=SPY&outputsize=compact&apikey=${AV_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Alpha Vantage HTTP ${res.status}`);
  const json = await res.json();

  // Handle all AV throttle/messages explicitly
  const info = json["Information"];
  const note = json["Note"];
  const errMsg = json["Error Message"];
  if (info) throw new Error(`Alpha Vantage info: ${info}`);
  if (note) throw new Error(`Alpha Vantage note: ${note}`);
  if (errMsg) throw new Error(`Alpha Vantage error: ${errMsg}`);

  const series = json["Time Series (Daily)"];
  if (!series || typeof series !== "object") {
    throw new Error("Alpha Vantage: missing 'Time Series (Daily)'");
  }

  const rows = Object.entries(series)
    .map(([date, v]) => ({ date, close: Number(v["4. close"]) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return rows.slice(-120); // last ~120 days
}


// ---------- STOOQ CSV (fallback, no key) ----------
async function fetchSPYDailyStooq() {
  // Stooq provides historical CSV: Date,Open,High,Low,Close,Volume
  // CORS is usually open; if your network blocks it, this will throw.
  const url = "https://stooq.com/q/d/l/?s=spy.us&i=d";
  const res = await fetch(url, { headers: { Accept: "text/csv" } });
  if (!res.ok) throw new Error(`Stooq HTTP ${res.status}`);
  const text = await res.text();

  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("Stooq: empty CSV");

  const header = lines[0].split(",");
  const dateIdx = header.indexOf("Date");
  const closeIdx = header.indexOf("Close");
  if (dateIdx === -1 || closeIdx === -1) throw new Error("Stooq: bad header");

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const date = cols[dateIdx];
    const close = Number(cols[closeIdx]);
    if (!date || !isFinite(close)) continue;
    rows.push({ date, close });
  }

  // Sort ascending and keep last ~120
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows.slice(-120);
}

// ---------- SMART WRAPPER ----------
export async function fetchSPYDailySmart() {
  const errors = [];

  // 1) Finnhub
  try {
    return await fetchSPYDailyFinnhub(120);
  } catch (e) {
    errors.push(e.message || String(e));
    // continue
  }

  // 2) Alpha Vantage
  try {
    return await fetchSPYDailyAlphaVantage();
  } catch (e) {
    errors.push(e.message || String(e));
    // continue
  }

  // 3) Stooq CSV
  try {
    return await fetchSPYDailyStooq();
  } catch (e) {
    errors.push(e.message || String(e));
  }

  throw new Error(`All sources failed: ${errors.join(" | ")}`);
}
