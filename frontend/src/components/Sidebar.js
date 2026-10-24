import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: "◈" },
  { to: "/datasets", label: "Datasets", icon: "▤" },
  { to: "/datasets/new", label: "Register dataset", icon: "＋" },
  { to: "/verify", label: "Verify integrity", icon: "✓" }
];

export default function Sidebar({ open, onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-brand">
        <div className="logo">D</div>
        <div className="brand-text">
          <strong>Data Observatory</strong>
          <small>Provenance</small>
        </div>
      </div>

      <div className="nav-section-label">Workspace</div>
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/datasets"}
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          onClick={onNavigate}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}

      <div className="sidebar-bottom">
        <div className="user-chip">
          <div className="avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div className="user-meta">
            <strong>{user?.name}</strong>
            <small>{user?.role === "auditor" ? "Auditor" : "Dataset owner"}</small>
          </div>
        </div>
        <button className="nav-link" onClick={logout} style={{ width: "100%" }}>
          <span className="nav-icon">↗</span>
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}