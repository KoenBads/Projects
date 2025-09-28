import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "var(--color-neutral)",
        padding: "12px 16px",
        borderRadius: 6,
        marginBottom: 16,
      }}
    >
      <h1 style={{ margin: 0, color: "var(--color-accent)" }}>ZAI Investing</h1>
      <nav>
        <Link to="/onboarding" style={{ marginRight: 12, color: "var(--color-white)" }}>
          Onboarding
        </Link>
        <Link to="/dashboard" style={{ marginRight: 12, color: "var(--color-white)" }}>
          Dashboard
        </Link>
        <Link to="/import" style={{ marginRight: 12, color: "var(--color-white)" }}>
          Import CSV
        </Link>
        <Link to="/portfolio" style={{ marginRight: 12, color: "var(--color-white)" }}>
          Portfolio
        </Link>
      </nav>
    </header>
  );
}
