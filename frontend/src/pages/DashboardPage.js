import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { datasetApi, extractError } from "../services/api";
import StatCard from "../components/StatCard";

function DatasetMiniCard({ dataset, onClick }) {
  const versions = dataset.versions || [];
  const latest = versions[versions.length - 1];
  return (
    <button className="dataset-card" onClick={onClick}>
      <div className="card-top">
        <div className="dataset-icon">▤</div>
        <span className={`badge ${latest?.blockchainStatus || "neutral"}`}>
          {latest?.blockchainStatus === "confirmed" ? "On-chain" : "Local"}
        </span>
      </div>
      <h3>{dataset.name}</h3>
      <p className="desc">{dataset.description || "No description provided."}</p>
      <div className="lineage-chips">
        {versions.slice(0, 5).map((v, i, arr) => (
          <span key={v.versionId} className={i === arr.length - 1 ? "latest" : ""}>
            V{v.versionNumber}
          </span>
        ))}
      </div>
      <div className="card-foot">
        <span>{dataset.category || "General"}</span>
        <span>V{dataset.currentVersion} →</span>
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const stats = useMemo(() => {
    const totalVersions = datasets.reduce(
      (sum, d) => sum + (d.versions?.length || 0),
      0
    );
    const onChain = datasets.reduce(
      (sum, d) =>
        sum +
        (d.versions || []).filter((v) => v.blockchainStatus === "confirmed").length,
      0
    );
    return {
      datasets: datasets.length,
      versions: totalVersions,
      onChain
    };
  }, [datasets]);

  const recent = datasets.slice(0, 4);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1>Good to see you, {user?.name?.split(" ")[0] || "there"}.</h1>
          <p className="sub">
            A clear view of your dataset lineage and on-chain integrity.
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

      <div className="stat-grid">
        <StatCard label="Datasets" value={stats.datasets} icon="▤" tone="" />
        <StatCard
          label="Versions tracked"
          value={stats.versions}
          icon="↗"
          tone="teal"
        />
        <StatCard
          label="On-chain records"
          value={stats.onChain}
          icon="◇"
          tone="coral"
        />
        <StatCard
          label="Verification"
          value="Ready"
          icon="✓"
          tone="amber"
          trend="Run from the Verify tab"
        />
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Recent lineage</p>
            <h2>Your latest datasets</h2>
          </div>
          <Link to="/datasets" className="btn-ghost">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="loader">
            <div className="spinner" />
            Loading datasets…
          </div>
        ) : recent.length === 0 ? (
          <div className="empty">
            <div className="icon">✳</div>
            <h3>Your provenance trail starts here</h3>
            <p>Register a CSV dataset to create its first version.</p>
            <Link to="/datasets/new" className="btn btn-primary">
              Register first dataset
            </Link>
          </div>
        ) : (
          <div className="dataset-grid">
            {recent.map((d) => (
              <DatasetMiniCard
                key={d.datasetId}
                dataset={d}
                onClick={() => navigate(`/datasets/${d.datasetId}`)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}