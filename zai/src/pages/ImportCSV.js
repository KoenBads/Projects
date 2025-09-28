// src/pages/Import.js
import { useState } from "react";
import Papa from "papaparse";
import Navbar from "../components/Navbar";
import { addRoundup } from "../services/roundups";

export default function ImportPage() {
  const [status, setStatus] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;
          let count = 0;

          for (const r of rows) {
            if (!r.date || !r.amount) continue;

            await addRoundup({
              date: r.date,
              amount: parseFloat(r.amount),
              userId: "demo-user", // 🔹 later tie to Firebase Auth
            });

            count++;
          }

          setStatus(`Imported ${count} roundups into Firestore.`);
        } catch (err) {
          console.error("Import failed:", err);
          setStatus("Failed to import roundups.");
        }
      },
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <Navbar />
      <h1 style={{ color: "var(--color-accent)" }}>Import CSV</h1>
      <p>Upload a CSV file with <code>date</code> and <code>amount</code> columns.</p>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ marginTop: 12 }}
      />

      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}
