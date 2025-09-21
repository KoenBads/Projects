import { useState } from "react";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";

const REQUIRED_HEADERS = ["date", "amount", "merchant", "category"];

function roundup(amount) {
  // amount is a number; if whole, 0; else (ceil - amount)
  const isWhole = Math.abs(amount - Math.trunc(amount)) < 1e-9;
  if (isWhole) return 0;
  const ceil = Math.trunc(amount) + 1;
  return Number((ceil - amount).toFixed(2));
}

export default function ImportCSV() {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [stats, setStats] = useState({ totalRoundups: 0, valid: 0, invalid: 0 });
  const navigate = useNavigate();

  const validateHeaders = (headers) => {
    const lower = headers.map(h => (h || "").toString().trim().toLowerCase());
    return REQUIRED_HEADERS.every(h => lower.includes(h));
  };

  const handleFile = (file) => {
    setErrors([]);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: { amount: true },
      complete: (result) => {
        const { data, meta } = result;

        // Header check
        if (!validateHeaders(meta.fields || [])) {
          setErrors(prev => [...prev, "Invalid headers. Expected: date,amount,merchant,category"]);
          return;
        }

        // Row validation + roundup calc
        let valid = 0, invalid = 0, totalRoundups = 0;
        const cleaned = data.map((r, idx) => {
          const line = idx + 2; // header is line 1
          const issues = [];

          // date check
          const d = new Date(r.date);
          if (!r.date || isNaN(d.getTime())) issues.push("Bad date");

          // amount check
          const amt = typeof r.amount === "number" ? r.amount : Number(r.amount);
          if (!isFinite(amt) || amt <= 0) issues.push("Bad amount");

          const validRow = issues.length === 0;
          if (validRow) {
            valid += 1;
            const ru = roundup(amt);
            totalRoundups += ru;
            return { ...r, amount: Number(amt.toFixed(2)), roundup: ru, _valid: true, _line: line };
          } else {
            invalid += 1;
            return { ...r, roundup: 0, _valid: false, _issues: issues, _line: line };
          }
        });

        setRows(cleaned);
        setStats({
          totalRoundups: Number(totalRoundups.toFixed(2)),
          valid, invalid
        });

        // persist to localStorage for Dashboard
        localStorage.setItem("zai_csv_rows", JSON.stringify(cleaned));
        localStorage.setItem("zai_roundups_total", String(Number(totalRoundups.toFixed(2))));
      },
      error: (err) => setErrors(prev => [...prev, err.message || "Parse error"]),
    });
  };

  const handleContinue = () => navigate("/dashboard");

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: "var(--color-primary)" }}>Import Transactions (CSV)</h1>
      <p style={{ color: "var(--color-accent)" }}>
        Expected headers: date, amount, merchant, category
      </p>

      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        style={{ marginTop: 12 }}
      />

      {errors.length > 0 && (
        <div style={{ marginTop: 16, color: "salmon" }}>
          <strong>Errors:</strong>
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Valid:</strong> {stats.valid} &nbsp;|&nbsp;
            <strong>Invalid:</strong> {stats.invalid} &nbsp;|&nbsp;
            <strong>Total Round-ups:</strong> ${stats.totalRoundups.toFixed(2)}
          </div>

          <div style={{ maxHeight: 280, overflow: "auto", border: "1px solid var(--color-neutral)", borderRadius: 6 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--color-white)" }}>
              <thead style={{ background: "var(--color-neutral)" }}>
                <tr>
                  <th style={{ textAlign: "left", padding: 8 }}>Line</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Date</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Amount</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Merchant</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Category</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Round-up</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((r, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #2a3a40" }}>
                    <td style={{ padding: 8 }}>{r._line}</td>
                    <td style={{ padding: 8 }}>{r.date}</td>
                    <td style={{ padding: 8 }}>${Number(r.amount || 0).toFixed(2)}</td>
                    <td style={{ padding: 8 }}>{r.merchant || "-"}</td>
                    <td style={{ padding: 8 }}>{r.category || "-"}</td>
                    <td style={{ padding: 8 }}>${Number(r.roundup || 0).toFixed(2)}</td>
                    <td style={{ padding: 8, color: r._valid ? "lightgreen" : "salmon" }}>
                      {r._valid ? "Valid" : `Invalid: ${(r._issues || []).join(", ")}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            style={{
              marginTop: 16,
              padding: "10px 16px",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-white)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer"
            }}
            onClick={handleContinue}
          >
            Continue to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
