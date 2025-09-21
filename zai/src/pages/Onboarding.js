import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const [strategy, setStrategy] = useState("SP500");
  const navigate = useNavigate();

  const handleContinue = () => {
    localStorage.setItem("zai_strategy", strategy);
    navigate("/dashboard");
  };

  return (
    <div style={{ textAlign: "center", marginTop: 50, fontFamily: "system-ui, sans-serif" }}>
      <h1>ZAI Investing</h1>
      <p>Invest smarter with AI simulations.</p>

      <h2 style={{ marginTop: 30 }}>Choose Your Strategy</h2>

      <div style={{ margin: 20 }}>
        <button
          style={{
            padding: "10px 20px",
            margin: 10,
            border: strategy === "SP500" ? "2px solid green" : "1px solid gray",
            borderRadius: 6,
            cursor: "pointer"
          }}
          onClick={() => setStrategy("SP500")}
        >
          📈 S&amp;P 500 Tracker
        </button>

        <button
          style={{ padding: "10px 20px", margin: 10, borderRadius: 6 }}
          disabled
          title="Coming soon"
        >
          👩‍⚖️ Pelosi Copy (Coming soon)
        </button>

        <button
          style={{ padding: "10px 20px", margin: 10, borderRadius: 6 }}
          disabled
          title="Coming soon"
        >
          🤖 ZAI AI Strategy (Coming soon)
        </button>
      </div>

      <button
        style={{
          marginTop: 20,
          padding: "10px 30px",
          backgroundColor: "green",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer"
        }}
        onClick={handleContinue}
      >
        Continue
      </button>
    </div>
  );
}
