import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { datasetApi, extractError } from "../services/api";
import StatusBadge from "../components/StatusBadge";

function truncate(hash, len = 14) {
  if (!hash) return "—";
  return hash.length <= len ? hash : `${hash.slice(0, len)}…`;
}

function HashRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }
  return (
    <div style={{ marginTop: 8 }}>
      <small
        style={{
          display: "block",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 5
        }}
      >
        {label}
      </small>
      <div className="hash-chip">
        <code title={value}>{value || "—"}</code>
        {value && (
          <button type="button" onClick={copy}>
            {copied ? "copied" : "copy"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DatasetDetailsPage() {
  const { datasetId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await datasetApi.get(datasetId);
        if (!cancelled) setData(res.data);
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
  }, [datasetId]);

  async function onDelete() {
    if (!data?.dataset) return;
    if (!window.confirm("Delete this dataset and all its versions?")) return;
    try {
      await datasetApi.remove(data.dataset.datasetId);
      navigate("/datasets", { replace: true });
    } catch (err) {
      setError(extractError(err));
    }
  }

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner" />
        Loading dataset…
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert error">
        <span>{error}</span>
        <Link to="/datasets" className="btn-ghost">
          ← Back to datasets
        </Link>
      </div>
    );
  }

  if (!data?.dataset) return null;

  const { dataset, versions = [], events = [] } = data;
  const orderedVersions = [...versions].sort(
    (a, b) => b.versionNumber - a.versionNumber
  );

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link to="/datasets" className="btn-ghost">
          ← Back to datasets
        </Link>
      </div>

      <div className="page-head">
        <div>
          <p className="eyebrow">Dataset provenance</p>
          <h1>{dataset.name}</h1>
          <p className="sub">
            {dataset.description || "No description"} · Source:{" "}
            {dataset.source || "Not specified"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link
            to={`/datasets/${dataset.datasetId}/blockchain`}
            className="btn btn-secondary"
          >
            ◇ On-chain records
          </Link>
          <Link
            to={`/datasets/${dataset.datasetId}/versions/new`}
            className="btn btn-primary"
          >
            ＋ Add version
          </Link>
          <button className="btn btn-secondary" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="meta-grid">
          <div className="meta-tile">
            <small>Dataset ID</small>
            <strong className="mono" title={dataset.datasetId}>
              {truncate(dataset.datasetId, 18)}
            </strong>
          </div>
          <div className="meta-tile">
            <small>Owner</small>
            <strong>{dataset.ownerName}</strong>
          </div>
          <div className="meta-tile">
            <small>Category</small>
            <strong>{dataset.category}</strong>
          </div>
          <div className="meta-tile">
            <small>Current version</small>
            <strong>V{dataset.currentVersion}</strong>
          </div>
          <div className="meta-tile">
            <small>Versions tracked</small>
            <strong>{versions.length}</strong>
          </div>
          <div className="meta-tile">
            <small>Created</small>
            <strong>{new Date(dataset.createdAt).toLocaleDateString()}</strong>
          </div>
        </div>
      </section>

      <div className="detail-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Lineage</p>
              <h2>Version history</h2>
            </div>
          </div>

          {orderedVersions.length === 0 ? (
            <div className="empty">
              <div className="icon">▤</div>
              <h3>No versions yet</h3>
            </div>
          ) : (
            <div className="timeline">
              {orderedVersions.map((v) => {
                const dotTone =
                  v.blockchainStatus === "confirmed"
                    ? "teal"
                    : v.blockchainStatus === "failed"
                    ? "red"
                    : "amber";
                return (
                  <div className="timeline-item" key={v.versionId}>
                    <div className={`dot ${dotTone}`} />
                    <div className="t-head">
                      <h4>
                        V{v.versionNumber} · {v.operation}
                      </h4>
                      <StatusBadge status={v.blockchainStatus} />
                    </div>
                    <div className="t-meta">
                      By {v.createdByName} ·{" "}
                      {new Date(v.createdAt).toLocaleString()}
                    </div>
                    {v.changeDescription && (
                      <p className="t-desc">{v.changeDescription}</p>
                    )}

                    <HashRow label="File SHA-256" value={v.fileHash} />
                    <HashRow
                      label="Previous version hash"
                      value={v.previousHash || "—"}
                    />
                    <HashRow
                      label="Blockchain transaction"
                      value={v.blockchainTxHash || "Not recorded"}
                    />

                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          navigate(`/verify?dataset=${dataset.datasetId}&version=${v.versionId}`)
                        }
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h2>Provenance events</h2>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="empty">
              <div className="icon">◈</div>
              <h3>No events recorded yet</h3>
              <p>Events appear here as you upload versions.</p>
            </div>
          ) : (
            <div className="timeline">
              {events.slice(0, 8).map((e) => (
                <div className="timeline-item" key={e._id}>
                  <div className="dot" />
                  <div className="t-head">
                    <h4>{e.operation}</h4>
                    <StatusBadge status={e.blockchainStatus} />
                  </div>
                  <div className="t-meta">
                    {e.userName} · {new Date(e.createdAt).toLocaleString()}
                  </div>
                  {e.description && <p className="t-desc">{e.description}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}