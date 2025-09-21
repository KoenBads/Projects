// src/pages/Dashboard.js   
import { Link } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import SP500Card from "../components/SP500Card";
import { fetchSPYQuote, fetchSPYDailySmart } from "../services/prices";
import { simulatePortfolio } from "../services/portfolio";
import { calculateStreaks } from "../services/streaks";

// 🔥 Responsive Heatmap (like GitHub contributions)
function StreakHeatmap({ weeks }) {
  if (!weeks || weeks.length === 0) return <p>No streak data yet.</p>;

  const maxInvested = Math.max(...weeks.map(w => w.invested));

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(12px, 1fr))", // ✅ responsive
      maxWidth: "640px", // keeps a clean width like GitHub
      gap: 3,
      marginTop: 8
    }}>
      {weeks.map((w, i) => {
        const intensity = maxInvested > 0 ? w.invested / maxInvested : 0;
        const bgColor =
          w.invested === 0
            ? "#2d3436"
            : `rgba(15, 164, 122, ${0.3 + 0.7 * intensity})`;

        return (
          <div
            key={i}
            title={`${w.week}: $${w.invested.toFixed(2)}`}
            style={{
              width: 12,
              height: 12,
              backgroundColor: bgColor,
              borderRadius: 2,
            }}
          />
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const strategy = useMemo(
    () => localStorage.getItem("zai_strategy") || "SP500",
    []
  );
  const totalRoundups = useMemo(
    () => Number(localStorage.getItem("zai_roundups_total") || "0"),
    []
  );

  const [spData, setSpData] = useState([]);
  const [spyQuote, setSpyQuote] = useState(null);
  const [priceError, setPriceError] = useState("");
  const [portfolio, setPortfolio] = useState(null);
  const [streaks, setStreaks] = useState({ currentStreak: 0, longestStreak: 0, weeklyTotals: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Live quote (Finnhub)
        const q = await fetchSPYQuote();
        if (mounted) setSpyQuote(q);

        // Historical series (Finnhub → AV fallback)
        const rows = await fetchSPYDailySmart();
        if (!mounted) return;
        setSpData(rows);
        localStorage.setItem("zai_spy_cache", JSON.stringify(rows));
        setPriceError("");
      } catch (e) {
        console.warn("Series fetch failed:", e.message || e);
        const cache = localStorage.getItem("zai_spy_cache");
        if (cache) {
          setSpData(JSON.parse(cache));
          setPriceError("Live history unavailable — showing cached data.");
        } else {
          setPriceError(`Unable to load S&P data (no cache). ${e.message || e}`);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ✅ Run portfolio simulation + streak calculation when data is ready
  useEffect(() => {
    if (spData.length && spyQuote) {
      const roundups = JSON.parse(localStorage.getItem("zai_roundups") || "[]");
      const sim = simulatePortfolio(roundups, spData, spyQuote.c);
      setPortfolio(sim);

      const s = calculateStreaks(roundups);
      setStreaks(s);
    }
  }, [spData, spyQuote]);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-neutral)", padding: "12px 16px", borderRadius: 6 }}>
        <h1 style={{ margin: 0, color: "var(--color-accent)" }}>Dashboard</h1>
        <nav>
          <Link to="/onboarding" style={{ marginRight: 12, color: "var(--color-white)" }}>Onboarding</Link>
          <Link to="/dashboard" style={{ marginRight: 12, color: "var(--color-white)" }}>Dashboard</Link>
          <Link to="/import" style={{ color: "var(--color-white)", marginRight: 12 }}>Import CSV</Link>
          <Link to="/portfolio" style={{ marginRight: 12, color: "var(--color-white)" }}>Portfolio</Link>
        </nav>
      </header>

      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Strategy:</strong> {strategy === "SP500" ? "S&P 500 Tracker" : strategy}
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Total Round-ups (sim):</strong> ${totalRoundups.toFixed(2)}
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>SPY (live):</strong> {spyQuote ? `$${spyQuote.c.toFixed(2)}` : "—"}
        </div>
        {priceError && (
          <div style={{ marginBottom: 8, color: "#ffb4a2" }}>{priceError}</div>
        )}

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
          {/* S&P 500 Chart */}
          <div style={{ border: "1px solid var(--color-neutral)", borderRadius: 8, padding: 16 }}>
            <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>S&P 500</h2>
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
          <div style={{ border: "1px solid var(--color-neutral)", borderRadius: 8, padding: 16 }}>
            <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>Simulated Portfolio</h2>
            {portfolio ? (
              <>
                <p><strong>Total Invested:</strong> ${portfolio.totalInvested.toFixed(2)}</p>
                <p><strong>Total Shares:</strong> {portfolio.shares.toFixed(4)} SPY</p>
                <p><strong>Current Value:</strong> ${portfolio.currentValue.toFixed(2)}</p>
              </>
            ) : (
              <p>No portfolio data yet.</p>
            )}
          </div>
        </div>

        {/* 🔥 Streaks Section with Responsive 52-week Heatmap */}
        <div style={{ marginTop: 16, border: "1px solid var(--color-neutral)", borderRadius: 8, padding: 16 }}>
          <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>🔥 Streaks</h2>
          <p><strong>Current Streak:</strong> {streaks.currentStreak} weeks</p>
          <p><strong>Longest Streak:</strong> {streaks.longestStreak} weeks</p>
          <StreakHeatmap weeks={streaks.weeklyTotals} />
        </div>
      </div>

      {/* Inline CSS spinner */}
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
