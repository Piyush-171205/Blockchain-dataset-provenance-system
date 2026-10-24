import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { datasetApi, extractError } from "../services/api";

export default function UploadDatasetPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("Education");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function onFileChange(e) {
    const picked = e.target.files?.[0] || null;
    setFile(picked);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please attach a CSV file.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only .csv files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be 10 MB or less.");
      return;
    }

    const form = new FormData();
    form.append("name", name.trim());
    form.append("source", source.trim());
    form.append("category", category.trim() || "General");
    form.append("description", description.trim());
    form.append("reason", reason.trim());
    form.append("file", file);

    setBusy(true);
    try {
      const res = await datasetApi.create(form);
      const datasetId = res.data?.dataset?.datasetId;
      if (datasetId) navigate(`/datasets/${datasetId}`, { replace: true });
      else navigate("/datasets", { replace: true });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">New record</p>
          <h1>Register a dataset</h1>
          <p className="sub">
            The original CSV becomes Version 1 of its provenance history.
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
            <label htmlFor="name">Dataset name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Student Performance Dataset"
              required
            />
          </div>

          <div className="form-grid two">
            <div className="field">
              <label htmlFor="source">Source</label>
              <input
                id="source"
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="College survey"
              />
            </div>
            <div className="field">
              <label htmlFor="category">Category</label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Education"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this dataset contain?"
            />
          </div>

          <div className="field">
            <label htmlFor="reason">Reason for registration</label>
            <textarea
              id="reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Initial dataset registration"
            />
          </div>

          <div className="field">
            <label>CSV file</label>
            <label
              className={`file-drop ${file ? "has-file" : ""}`}
              htmlFor="file-input"
            >
              <input
                id="file-input"
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={onFileChange}
              />
              <div className="icon">{file ? "✓" : "⬆"}</div>
              <strong>
                {file ? file.name : "Click to choose a CSV file"}
              </strong>
              <small>
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB · ${
                      file.type || "text/csv"
                    }`
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
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
            >
              {busy ? "Registering…" : "Create dataset record"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}