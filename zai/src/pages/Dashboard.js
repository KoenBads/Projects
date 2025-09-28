// src/pages/Dashboard.js
import { Link } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import SP500Card from "../components/SP500Card";
import { getCachedSPYQuote, getCachedSPYDaily } from "../services/marketData";
import { getRoundups } from "../services/roundups";
import { simulatePortfolio } from "../services/portfolio";
import { calculateStreaks } from "../services/streaks";

export default function Dashboard() {
  const strategy = useMemo(
    () => localStorage.getItem("zai_strategy") || "SP500",
    []
  );

  const [spData, setSpData] = useState([]);
  const [spyQuote, setSpyQuote] = useState(null);
  const [priceError, setPriceError] = useState("");
  const [portfolio, setPortfolio] = useState(null);
  const [streakData, setStreakData] = useState({ weeklyTotals: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [quote, rows, roundups] = await Promise.all([
          getCachedSPYQuote(),
          getCachedSPYDaily(),
          getRoundups("demo-user"),
        ]);

        if (!mounted) return;

        setSpyQuote(quote);
        setSpData(rows);

        // Portfolio simulation
        const sim = simulatePortfolio(roundups, rows, quote.c);
        setPortfolio(sim);

        // Streaks
        setStreakData(calculateStreaks(roundups));
        setPriceError("");
      } catch (e) {
        console.warn("Dashboard load failed:", e.message || e);
        setPriceError(`Unable to load S&P data. ${e.message || e}`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <Navbar />

      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Strategy:</strong>{" "}
          {strategy === "SP500" ? "S&P 500 Tracker" : strategy}
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>SPY (live):</strong>{" "}
          {spyQuote ? `$${spyQuote.c.toFixed(2)}` : "—"}
        </div>
        {priceError && (
          <div style={{ marginBottom: 8, color: "#ffb4a2" }}>{priceError}</div>
        )}

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          {/* S&P 500 Chart */}
          <div
            style={{
              border: "1px solid var(--color-neutral)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>
              S&P 500
            </h2>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div className="spinner" />
                <p>Loading S&P 500 data...</p>
              </div>
            ) : spData.length > 0 ? (
              <SP500Card data={spData} />
            ) : (
              <p>No chart data available.</p>
            )}
          </div>

          {/* Portfolio Card */}
          <div
            style={{
              border: "1px solid var(--color-neutral)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>
              Simulated Portfolio
            </h2>
            {portfolio ? (
              <>
                <p>
                  <strong>Total Invested:</strong> $
                  {portfolio.totalInvested.toFixed(2)}
                </p>
                <p>
                  <strong>Total Shares:</strong>{" "}
                  {portfolio.shares.toFixed(4)} SPY
                </p>
                <p>
                  <strong>Current Value:</strong> $
                  {portfolio.currentValue.toFixed(2)}
                </p>
              </>
            ) : (
              <p>No portfolio data yet.</p>
            )}
          </div>
        </div>

        {/* Streak Heatmap */}
        <div
          style={{
            marginTop: 24,
            border: "1px solid var(--color-neutral)",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>
            Weekly Investment Streaks
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(26, 1fr)",
              gap: 2,
              marginTop: 8,
            }}
          >
            {streakData.weeklyTotals.map((w, i) => (
              <div
                key={i}
                title={`${w.week}: $${w.invested.toFixed(2)}`}
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor:
                    w.invested === 0
                      ? "#eee"
                      : w.invested < 5
                      ? "#B8F2A0"
                      : w.invested < 20
                      ? "#0FA47A"
                      : "#064635",
                }}
              />
            ))}
          </div>
          <p style={{ marginTop: 8 }}>
            Current streak: {streakData.currentStreak} weeks | Longest streak:{" "}
            {streakData.longestStreak} weeks
          </p>
        </div>
      </div>

      {/* Spinner styles */}
      <style>{`
        .spinner {
          margin: 0 auto 10px auto;
          width: 24px;
          height: 24px;
          border: 3px solid #ccc;
          border-top: 3px solid #0FA47A;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
