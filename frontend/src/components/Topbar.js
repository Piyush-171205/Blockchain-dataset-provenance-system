import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ onMenuToggle, subtitle = "Local research workspace" }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="crumb">
        <button
          className="btn-ghost"
          style={{ display: "none", padding: 6 }}
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <span className="live-dot" />
        {subtitle}
      </div>
      <div className="top-right">
        <span>{user?.email}</span>
      </div>
    </header>
  );
}