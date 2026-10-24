import React from "react";

export default function StatCard({ label, value, icon = "◈", tone = "", trend }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {trend && <div className="trend">{trend}</div>}
    </div>
  );
}