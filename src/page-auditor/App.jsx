import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import AuditResult from "@/pages/AuditResult";

export default function LocalPageAuditorApp() {
  return (
    <div className="tse-page-auditor-scope">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/audits/:auditId" element={<AuditResult />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
