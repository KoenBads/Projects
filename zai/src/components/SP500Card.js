import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const mockData = [
  { date: "2025-08-25", close: 5480 },
  { date: "2025-08-26", close: 5508 },
  { date: "2025-08-27", close: 5492 },
  { date: "2025-08-28", close: 5520 },
  { date: "2025-08-29", close: 5533 },
  { date: "2025-09-03", close: 5511 },
  { date: "2025-09-04", close: 5542 },
  { date: "2025-09-05", close: 5554 },
];

export default function SP500Card({ data }) {
  const series = useMemo(() => (data?.length ? data : mockData), [data]);
  const latest = series[series.length - 1]?.close ?? 0;

  return (
    <div style={{ border: "1px solid var(--color-neutral)", borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>S&amp;P 500</h2>
      <div style={{ marginBottom: 8 }}>
        <strong>Latest:</strong>{" "}
        <span style={{ color: "var(--color-accent)" }}>{latest.toLocaleString()}</span>
      </div>

      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#2a3a40" />
            <XAxis dataKey="date" stroke="var(--color-white)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--color-white)" tick={{ fontSize: 12 }} domain={["dataMin", "dataMax"]} />
            <Tooltip
              contentStyle={{ background: "#0D1B1E", border: "1px solid #60717A", color: "#fff" }}
              labelStyle={{ color: "#B8F2A0" }}
            />
            <Line type="monotone" dataKey="close" dot={false} stroke="var(--color-accent)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {!data?.length && (
        <p style={{ color: "var(--color-neutral)", marginTop: 8 }}>
          Showing mock data. Connect an API to load live prices.
        </p>
      )}
    </div>
  );
}
