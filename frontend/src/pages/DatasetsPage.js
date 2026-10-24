import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { datasetApi, extractError } from "../services/api";

function DatasetCard({ dataset, onClick }) {
  const versions = dataset.versions || [];
  const latest = versions[versions.length - 1];
  return (
    <button className="dataset-card" onClick={onClick}>
      <div className="card-top">
        <div className="dataset-icon">▤</div>
        <span className={`badge ${latest?.blockchainStatus || "neutral"}`}>
          {latest?.blockchainStatus === "confirmed"
            ? "On-chain"
            : latest?.blockchainStatus === "pending"
            ? "Pending"
            : "Local"}
        </span>
      </div>
      <h3>{dataset.name}</h3>
      <p className="desc">{dataset.description || "No description provided."}</p>

      <div className="lineage-chips">
        {versions.slice(0, 6).map((v, i, arr) => (
          <span
            key={v.versionId}
            className={i === arr.length - 1 ? "latest" : ""}
          >
            V{v.versionNumber}
          </span>
        ))}
        {versions.length > 6 && <span>+{versions.length - 6}</span>}
      </div>

      <div className="card-foot">
        <span>{dataset.category || "General"}</span>
        <span>
          V{dataset.currentVersion} · {versions.length} version
          {versions.length === 1 ? "" : "s"} →
        </span>
      </div>
    </button>
  );
}

export default function DatasetsPage() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await datasetApi.list();
        if (!cancelled) setDatasets(res.data || []);
      } catch (err) {
        if (!cancelled) setError(extractError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return datasets;
    return datasets.filter((d) =>
      [d.name, d.description, d.category, d.source]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [datasets, query]);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Library</p>
          <h1>Datasets</h1>
          <p className="sub">
            Browse your registered datasets and follow their version history.
          </p>
        </div>
        <Link to="/datasets/new" className="btn btn-primary">
          ＋ Register dataset
        </Link>
      </div>

      {error && (
        <div className="alert error">
          <span>{error}</span>
        </div>
      )}

      <div className="panel" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="search"
            placeholder="Search by name, description, category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              padding: "11px 14px",
              borderRadius: 12,
              border: "1px solid var(--line-strong)",
              outline: "none",
              background: "#fff"
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="loader">
          <div className="spinner" />
          Loading datasets…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="icon">▤</div>
          <h3>{datasets.length === 0 ? "No datasets yet" : "No matches"}</h3>
          <p>
            {datasets.length === 0
              ? "Register your first CSV dataset to start a provenance trail."
              : "Try a different search term."}
          </p>
          {datasets.length === 0 && (
            <Link to="/datasets/new" className="btn btn-primary">
              Register dataset
            </Link>
          )}
        </div>
      ) : (
        <div className="dataset-grid">
          {filtered.map((d) => (
            <DatasetCard
              key={d.datasetId}
              dataset={d}
              onClick={() => navigate(`/datasets/${d.datasetId}`)}
            />
          ))}
        </div>
      )}
    </>
  );
}