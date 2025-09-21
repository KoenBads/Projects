// src/components/StreakHeatmap.js
export default function StreakHeatmap({ weeks }) {
  if (!weeks || weeks.length === 0) return <p>No streak data yet.</p>;

  // find max for scaling brightness
  const maxInvested = Math.max(...weeks.map(w => w.invested));

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, 20px)",
      gap: 4,
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
              width: 20,
              height: 20,
              backgroundColor: bgColor,
              borderRadius: 4,
            }}
          />
        );
      })}
    </div>
  );
}
