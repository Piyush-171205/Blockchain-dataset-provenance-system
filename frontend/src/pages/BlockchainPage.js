import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { datasetApi, blockchainApi, extractError } from "../services/api";
import StatusBadge from "../components/StatusBadge";

export default function BlockchainPage() {
  const { datasetId } = useParams();

  const [dataset, setDataset] = useState(null);
  const [onChain, setOnChain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [dRes, cRes] = await Promise.all([
          datasetApi.get(datasetId),
          blockchainApi.history(datasetId)
        ]);
        if (!cancelled) {
          setDataset(dRes.data.dataset);
          setOnChain(cRes.data);
        }
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

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner" />
        Reading blockchain records…
      </div>
    );
  }

  const records = onChain?.records || [];
  const configured = onChain?.configured !== false;

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link to={`/datasets/${datasetId}`} className="btn-ghost">
          ← Back to dataset
        </Link>
      </div>

      <div className="page-head">
        <div>
          <p className="eyebrow">Blockchain</p>
          <h1>On-chain provenance records</h1>
          <p className="sub">
            {dataset
              ? `Immutable records anchored to the local chain for "${dataset.name}".`
              : "Records written to the DatasetProvenance smart contract."}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert error">
          <span>{error}</span>
        </div>
      )}

      {!configured && (
        <div className="alert warn">
          Blockchain service is not configured. Set CONTRACT_ADDRESS and
          BLOCKCHAIN_PRIVATE_KEY in backend/.env.
        </div>
      )}

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Ledger</p>
            <h2>Records ({records.length})</h2>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="empty">
            <div className="icon">◇</div>
            <h3>No on-chain records yet</h3>
            <p>
              Records will appear here once versions are anchored to the
              contract.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Operation</th>
                  <th>Version ID</th>
                  <th>File hash</th>
                  <th>Previous hash</th>
                  <th>Recorded by</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={`${r.versionId}-${i}`}>
                    <td>{i + 1}</td>
                    <td>
                      <StatusBadge status="info" label={r.operation} />
                    </td>
                    <td className="mono" title={r.versionId}>
                      {r.versionId.slice(0, 12)}…
                    </td>
                    <td className="mono" title={r.fileHash}>
                      {r.fileHash.slice(0, 14)}…
                    </td>
                    <td className="mono" title={r.previousHash || "—"}>
                      {r.previousHash
                        ? `${r.previousHash.slice(0, 14)}…`
                        : "—"}
                    </td>
                    <td className="mono" title={r.recordedBy}>
                      {r.recordedBy.slice(0, 10)}…
                    </td>
                    <td>{new Date(r.timestamp * 1000).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}