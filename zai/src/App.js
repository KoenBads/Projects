import { Routes, Route, Navigate } from "react-router-dom";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import ImportCSV from "./pages/ImportCSV"; 
import Portfolio from "./pages/Portfolio";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/onboarding" replace />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/import" element={<ImportCSV />} /> {}
      <Route path="*" element={<Navigate to="/onboarding" replace />} />
      <Route path="/portfolio" element={<Portfolio />} />
    </Routes>
  );
}
