import { useEffect, useState } from "react";
import { simulatePortfolio } from "../services/portfolio";
import { fetchSPYQuote, fetchSPYDailySmart } from "../services/prices";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [quote, rawPrices] = await Promise.all([
          fetchSPYQuote(),
          fetchSPYDailySmart(),
        ]);

        // ✅ Normalize prices to { date, close }
        let prices = [];
        if (Array.isArray(rawPrices)) {
          prices = rawPrices;
        } else if (rawPrices?.t && rawPrices?.c) {
          prices = rawPrices.t.map((ts, i) => ({
            date: new Date(ts * 1000).toISOString().slice(0, 10),
            close: rawPrices.c[i],
          }));
        } else {
          console.warn("Unexpected price format:", rawPrices);
        }

        // ✅ Load or mock roundups
        let roundups = JSON.parse(localStorage.getItem("zai_roundups") || "[]");
        if (!roundups || roundups.length === 0) {
          console.warn("No roundups found, using mock data for testing.");
          roundups = [
            { date: "2025-01-01", amount: 5.0 },
            { date: "2025-01-08", amount: 2.75 },
            { date: "2025-01-12", amount: 3.5 },
          ];
        }

        // ✅ Debug logs
        console.log("=== DEBUG START ===");
        console.log("Roundups:", roundups);
        console.log("Prices sample (first 5):", prices.slice(0, 5));
        console.log("Quote:", quote);
        console.log("=== DEBUG END ===");

        const sim = simulatePortfolio(roundups, prices, quote?.c || 400);

        if (mounted) setPortfolio(sim);
      } catch (err) {
        console.error("Portfolio fetch failed:", err);
        if (mounted) setPortfolio(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <p style={{ padding: 24 }}>Loading portfolio...</p>;
  }

  if (!portfolio || !portfolio.history || portfolio.history.length === 0) {
    return <p style={{ padding: 24 }}>⚠️ No portfolio data available.</p>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: "var(--color-accent)" }}>Portfolio Details</h1>

      {/* Summary */}
      <div style={{ marginBottom: 16 }}>
        <p><strong>Total Invested:</strong> ${portfolio.totalInvested.toFixed(2)}</p>
        <p><strong>Total Shares:</strong> {portfolio.shares.toFixed(4)} SPY</p>
        <p><strong>Current Value:</strong> ${portfolio.currentValue.toFixed(2)}</p>
        <p>
          <strong>Gain/Loss:</strong>{" "}
          <span style={{ color: portfolio.currentValue - portfolio.totalInvested >= 0 ? "#0FA47A" : "#ff4d4d" }}>
            ${(portfolio.currentValue - portfolio.totalInvested).toFixed(2)}
          </span>
        </p>
      </div>

      {/* Growth Chart */}
      <div style={{ border: "1px solid var(--color-neutral)", borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>Portfolio Growth</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={portfolio.history}>
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="totalInvested" stroke="#60717A" dot={false} name="Total Invested" />
            <Line type="monotone" dataKey="valueNow" stroke="#0FA47A" dot={false} name="Current Value" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Holdings Table */}
      <div style={{ border: "1px solid var(--color-neutral)", borderRadius: 8, padding: 16 }}>
        <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>Holdings History</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
          <thead>
            <tr style={{ background: "var(--color-neutral)", color: "white" }}>
              <th style={{ padding: 8, textAlign: "left" }}>Date</th>
              <th style={{ padding: 8, textAlign: "right" }}>Invested ($)</th>
              <th style={{ padding: 8, textAlign: "right" }}>Price ($)</th>
              <th style={{ padding: 8, textAlign: "right" }}>Shares Bought</th>
              <th style={{ padding: 8, textAlign: "right" }}>Total Shares</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.history.map((h, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #444" }}>
                <td style={{ padding: 8 }}>{h.date}</td>
                <td style={{ padding: 8, textAlign: "right" }}>{h.invested.toFixed(2)}</td>
                <td style={{ padding: 8, textAlign: "right" }}>{h.price.toFixed(2)}</td>
                <td style={{ padding: 8, textAlign: "right" }}>{h.boughtShares.toFixed(4)}</td>
                <td style={{ padding: 8, textAlign: "right" }}>{h.totalShares.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
