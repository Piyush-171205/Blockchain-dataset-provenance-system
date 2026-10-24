import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { datasetApi, versionApi, extractError } from "../services/api";

const OPERATIONS = [
  { value: "CLEANED", label: "Cleaned" },
  { value: "FILTERED", label: "Filtered" },
  { value: "TRANSFORMED", label: "Transformed" },
  { value: "MERGED", label: "Merged" },
  { value: "UPDATED", label: "Updated" },
  { value: "ANALYZED", label: "Analyzed" },
  { value: "EXPORTED", label: "Exported" }
];

export default function AddVersionPage() {
  const { datasetId } = useParams();
  const navigate = useNavigate();

  const [dataset, setDataset] = useState(null);
  const [operation, setOperation] = useState("CLEANED");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await datasetApi.get(datasetId);
        if (!cancelled) setDataset(res.data.dataset);
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

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please attach a CSV file.");
      return;
    }

    const form = new FormData();
    form.append("operation", operation);
    form.append("description", description.trim());
    form.append("reason", reason.trim());
    form.append("file", file);

    setBusy(true);
    try {
      await versionApi.create(datasetId, form);
      navigate(`/datasets/${datasetId}`, { replace: true });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
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

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link to={`/datasets/${datasetId}`} className="btn-ghost">
          ← Back to dataset
        </Link>
      </div>

      <div className="page-head">
        <div>
          <p className="eyebrow">Continue the journey</p>
          <h1>Add a new version</h1>
          <p className="sub">
            {dataset ? (
              <>
                For <strong>{dataset.name}</strong> · currently V
                {dataset.currentVersion}
              </>
            ) : (
              "Upload a snapshot and describe what changed."
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert error">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="panel" style={{ maxWidth: 760 }}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="operation">Operation</label>
            <select
              id="operation"
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
            >
              {OPERATIONS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="description">What changed?</label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Removed duplicate rows and normalized salary values"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="reason">Why?</label>
            <textarea
              id="reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Data cleaning"
            />
          </div>

          <div className="field">
            <label>New CSV file</label>
            <label className={`file-drop ${file ? "has-file" : ""}`}>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="icon">{file ? "✓" : "⬆"}</div>
              <strong>{file ? file.name : "Click to choose a CSV file"}</strong>
              <small>
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB`
                  : "Only .csv · up to 10 MB"}
              </small>
            </label>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 6
            }}
          >
            <Link
              to={`/datasets/${datasetId}`}
              className="btn btn-secondary"
              style={{ pointerEvents: busy ? "none" : "auto" }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
            >
              {busy ? "Saving…" : "Create next version"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}