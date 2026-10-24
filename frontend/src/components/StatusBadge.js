import React from "react";

const LABELS = {
  confirmed: "On-chain",
  pending: "Pending",
  failed: "Failed",
  "not-configured": "Local only",
  match: "Verified",
  mismatch: "Tampered",
  active: "Active",
  archived: "Archived"
};

export default function StatusBadge({ status, label }) {
  const safe = status || "neutral";
  const text = label || LABELS[safe] || safe;
  return <span className={`badge ${safe}`}>{text}</span>;
}