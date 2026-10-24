import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { datasetApi, verifyApi, extractError } from "../services/api";
import StatusBadge from "../components/StatusBadge";

function ResultBox({ result }) {
  if (!result) return null;
  const isMatch = result.result === "match";
  return (
    <div className={`verify-box ${isMatch ? "match" : "mismatch"}`}>
      <div className="v-icon">{isMatch ? "✓" : "⚠"}</div>
      <h3>{isMatch ? "Integrity verified" : "Integrity mismatch detected"}</h3>
      <p>
        {isMatch
          ? "The file content matches the registered version exactly."
          : "The file differs from the registered version. The on-chain record still holds the original hash."}
      </p>

      <div className="hash-compare">
        <div className="h-col">
          <small>Registered hash</small>
          <code>{result.registeredHash}</code>
        </div>
        <div className="h-col">
          <small>Calculated hash</small>
          <code>{result.calculatedHash}</code>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "center",
          gap: 10,
          flexWrap: "wrap"
        }}
      >
        <StatusBadge status={result.blockchainStatus} />
        {result.transactionHash && (
          <span className="hash-chip">
            <code title={result.transactionHash}>
              {result.transactionHash.slice(0, 24)}…
            </code>
          </span>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDatasetId, setSelectedDatasetId] = useState(
    searchParams.get("dataset") || ""
  );
  const [datasetDetails, setDatasetDetails] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(
    searchParams.get("version") || ""
  );

  const [mode, setMode] = useState("stored"); // "stored" | "file"
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedDatasetId) {
        setDatasetDetails(null);
        return;
      }
      try {
        const res = await datasetApi.get(selectedDatasetId);
        if (!cancelled) {
          setDatasetDetails(res.data);
          const versions = res.data.versions || [];
          if (
            versions.length > 0 &&
            !versions.some((v) => v.versionId === selectedVersionId)
          ) {
            setSelectedVersionId(versions[versions.length - 1].versionId);
          }
        }
      } catch (err) {
        if (!cancelled) setError(extractError(err));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDatasetId]);

  // keep URL in sync
  useEffect(() => {
    const next = {};
    if (selectedDatasetId) next.dataset = selectedDatasetId;
    if (selectedVersionId) next.version = selectedVersionId;
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDatasetId, selectedVersionId]);

  const versionOptions = useMemo(() => {
    const versions = datasetDetails?.versions || [];
    return [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
  }, [datasetDetails]);

  async function runStoredVerification() {
    if (!selectedDatasetId || !selectedVersionId) {
      setError("Pick a dataset and a version first.");
      return;
    }
    setError("");
    setResult(null);
    setBusy(true);
    try {
      const res = await verifyApi.stored(selectedDatasetId, selectedVersionId);
      setResult(res.data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  async function runFileVerification() {
    if (!selectedDatasetId || !selectedVersionId) {
      setError("Pick a dataset and a version first.");
      return;
    }
    if (!file) {
      setError("Attach a CSV file to compare.");
      return;
    }
    setError("");
    setResult(null);
    setBusy(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await verifyApi.file(
        selectedDatasetId,
        selectedVersionId,
        form
      );
      setResult(res.data);
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
        Loading…
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Integrity</p>
          <h1>Verify dataset integrity</h1>
          <p className="sub">
            Compare the stored version on disk, or upload a copy to compare its
            SHA-256 hash against the registered record.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert error">
          <span>{error}</span>
        </div>
      )}

      <div className="detail-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Step 1</p>
              <h2>Choose a version</h2>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="dataset">Dataset</label>
              <select
                id="dataset"
                value={selectedDatasetId}
                onChange={(e) => {
                  setSelectedDatasetId(e.target.value);
                  setSelectedVersionId("");
                  setResult(null);
                }}
              >
                <option value="">— select a dataset —</option>
                {datasets.map((d) => (
                  <option key={d.datasetId} value={d.datasetId}>
                    {d.name} · V{d.currentVersion}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="version">Version</label>
              <select
                id="version"
                value={selectedVersionId}
                onChange={(e) => {
                  setSelectedVersionId(e.target.value);
                  setResult(null);
                }}
                disabled={!datasetDetails}
              >
                <option value="">— select a version —</option>
                {versionOptions.map((v) => (
                  <option key={v.versionId} value={v.versionId}>
                    V{v.versionNumber} · {v.operation}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="panel-head" style={{ marginTop: 22 }}>
            <div>
              <p className="eyebrow">Step 2</p>
              <h2>Choose verification mode</h2>
            </div>
          </div>

          <div className="auth-tabs" style={{ maxWidth: 400 }}>
            <button
              type="button"
              className={mode === "stored" ? "active" : ""}
              onClick={() => {
                setMode("stored");
                setResult(null);
              }}
            >
              Stored file
            </button>
            <button
              type="button"
              className={mode === "file" ? "active" : ""}
              onClick={() => {
                setMode("file");
                setResult(null);
              }}
            >
              Upload a copy
            </button>
          </div>

          {mode === "file" && (
            <div className="field" style={{ marginTop: 12 }}>
              <label>CSV file to compare</label>
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
                    : "The original and modified files should produce different hashes"}
                </small>
              </label>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button
              className="btn btn-primary"
              disabled={busy || !selectedDatasetId || !selectedVersionId}
              onClick={mode === "stored" ? runStoredVerification : runFileVerification}
            >
              {busy ? "Running…" : "Run verification"}
            </button>
            {selectedDatasetId && (
              <Link
                to={`/datasets/${selectedDatasetId}`}
                className="btn btn-secondary"
              >
                Open dataset
              </Link>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Result</p>
              <h2>Verification outcome</h2>
            </div>
          </div>

          {busy && (
            <div className="loader">
              <div className="spinner" />
              Hashing file and querying the chain…
            </div>
          )}

          {!busy && !result && (
            <div className="empty">
              <div className="icon">✓</div>
              <h3>Awaiting verification</h3>
              <p>Pick a dataset, a version, then run verification.</p>
            </div>
          )}

          {!busy && result && <ResultBox result={result} />}
        </section>
      </div>
    </>
  );
}