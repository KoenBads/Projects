// src/services/marketData.js
import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

// Utility: check if cache is stale (>24h)
function isStale(timestamp) {
  if (!timestamp || !timestamp.toDate) return true;
  const now = new Date();
  const last = timestamp.toDate();
  const diffHours = (now - last) / (1000 * 60 * 60);
  return diffHours > 24;
}

/**
 * Get cached SPY latest quote (closing price) from Firestore.
 * Refreshes from Alpha Vantage if cache is missing/stale.
 */
export async function getCachedSPYQuote() {
  const ref = doc(db, "marketData", "spyQuote");
  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    const data = snapshot.data();
    if (!isStale(data.updatedAt) || data.quote) {
      console.log("Using Firestore cached SPY quote");
      return data.quote;
    }
  }

  // Fetch from Alpha Vantage
  const apiKey = process.env.REACT_APP_ALPHAVANTAGE_KEY;
  const res = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${apiKey}`
  );
  if (!res.ok) throw new Error("Failed to fetch SPY quote");
  const json = await res.json();

  // Extract closing price
  const price = parseFloat(json["Global Quote"]["05. price"]);
  const data = { c: price };

  await setDoc(ref, { quote: data, updatedAt: serverTimestamp() });
  console.log("♻️ Cached new SPY quote (Alpha Vantage)");
  return data;
}

/**
 * Get cached SPY daily prices from Firestore.
 * Refreshes from Alpha Vantage if cache is missing/stale.
 */
export async function getCachedSPYDaily() {
  const ref = doc(db, "marketData", "spyDaily");
  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    const data = snapshot.data();
    if (!isStale(data.updatedAt) || (data.prices && data.prices.length > 0)) {
      console.log(" Using Firestore cached SPY daily data");
      return data.prices;
    }
  }

  // Fetch from Alpha Vantage
  const apiKey = process.env.REACT_APP_ALPHAVANTAGE_KEY;
  const res = await fetch(
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=SPY&outputsize=compact&apikey=${apiKey}`
  );
  if (!res.ok) throw new Error("Failed to fetch SPY daily prices");
  const json = await res.json();

  const prices = [];
  const series = json["Time Series (Daily)"];
  if (series) {
    for (const [date, values] of Object.entries(series)) {
      prices.push({
        date,
        close: parseFloat(values["4. close"]),
      });
    }
    prices.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  await setDoc(ref, { prices, updatedAt: serverTimestamp() });
  console.log("♻️ Cached new SPY daily data (Alpha Vantage)");
  return prices;
}
