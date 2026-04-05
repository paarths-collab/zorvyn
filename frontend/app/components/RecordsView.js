"use client";

import { useEffect, useState } from "react";
import { apiFetch, ALL_CATS, fmt, fmtN } from "../lib/api";
import { TypeBadge } from "./Badge";
import EditModal from "./EditModal";

/**
 * Full records table with type/category/date-range filters.
 * Admins see Edit + Delete buttons; Analyst sees no action column.
 */
export default function RecordsView({ token, capability }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [editRec, setEditRec] = useState(null);
  const [filters, setFilters] = useState({ type: "", category: "", start_date: "", end_date: "" });

  async function loadRecords(f) {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (f.type)       params.set("type",       f.type);
      if (f.category)   params.set("category",   f.category);
      if (f.start_date) params.set("start_date", f.start_date);
      if (f.end_date)   params.set("end_date",   f.end_date);
      const data = await apiFetch(`/records/?${params}`, token);
      setRecords(data || []);
    } catch (e) { setError(e.message); }
    finally    { setLoading(false); }
  }

  // Load on mount
  useEffect(() => { loadRecords(filters); }, []); // eslint-disable-line

  function applyFilters(e) { e.preventDefault(); loadRecords(filters); }
  function clearFilters()  {
    const empty = { type: "", category: "", start_date: "", end_date: "" };
    setFilters(empty); loadRecords(empty);
  }

  async function handleDelete(id) {
    if (!window.confirm("Permanently delete this record?")) return;
    try {
      await apiFetch(`/records/${id}`, token, { method: "DELETE" });
      loadRecords(filters);
    } catch (e) { setError(e.message); }
  }

  const showActions = capability.canEdit || capability.canDelete;

  return (
    <div>
      {/* Edit modal (admin only) */}
      {editRec && (
        <EditModal
          record={editRec}
          token={token}
          onClose={() => setEditRec(null)}
          onSuccess={() => { setEditRec(null); loadRecords(filters); }}
        />
      )}

      {/* ── Filter Bar ──────────────────────────────── */}
      <form className="filter-bar" onSubmit={applyFilters}>
        <div className="filter-group">
          <label className="filter-label">Type</label>
          <select className="select" id="filter-type" value={filters.type}
            onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Category</label>
          <select className="select" id="filter-category" value={filters.category}
            onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
            <option value="">All Categories</option>
            {ALL_CATS.map((c) => <option key={c} value={c}>{fmtN(c)}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">From</label>
          <input className="input" id="filter-start" type="date" value={filters.start_date}
            onChange={(e) => setFilters((p) => ({ ...p, start_date: e.target.value }))} />
        </div>

        <div className="filter-group">
          <label className="filter-label">To</label>
          <input className="input" id="filter-end" type="date" value={filters.end_date}
            onChange={(e) => setFilters((p) => ({ ...p, end_date: e.target.value }))} />
        </div>

        <div style={{ display: "flex", gap: 8, alignSelf: "flex-end" }}>
          <button className="btn btn-primary" id="apply-filters" type="submit">Apply</button>
          <button className="btn btn-soft"    id="clear-filters" type="button" onClick={clearFilters}>Clear</button>
        </div>
      </form>

      {error && <div className="msg-error">{error}</div>}

      {/* ── Records Table ────────────────────────────── */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0, fontSize: 14 }}>All Records</h4>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {loading ? "Loading…" : `${records.length} record${records.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Payment</th>
                <th>Reference</th>
                <th>Amount</th>
                {showActions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={showActions ? 9 : 8}
                    style={{ textAlign: "center", color: "var(--muted)", padding: "40px", fontSize: 13 }}>
                    No records found. Try adjusting your filters.
                  </td>
                </tr>
              )}

              {records.map((r) => (
                <tr key={r.id}>
                  <td style={{ color: "var(--muted)", fontSize: 11 }}>#{r.id}</td>
                  <td>{r.date}</td>
                  <td><TypeBadge type={r.type} /></td>
                  <td>{fmtN(r.category)}</td>
                  <td>
                    <div className="desc-text" title={r.description || ""}>
                      {r.description || "—"}
                    </div>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{fmtN(r.payment_method)}</td>
                  <td style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
                    {r.reference_id || "—"}
                  </td>
                  <td style={{ fontWeight: 700, color: r.type === "income" ? "#16a34a" : "#dc2626" }}>
                    {r.type === "income" ? "+" : "-"}{fmt(r.amount)}
                  </td>

                  {showActions && (
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {capability.canEdit && (
                          <button className="btn btn-soft" id={`edit-rec-${r.id}`}
                            style={{ fontSize: 11, padding: "5px 10px" }}
                            onClick={() => setEditRec(r)}>
                            Edit
                          </button>
                        )}
                        {capability.canDelete && (
                          <button className="btn btn-soft" id={`del-rec-${r.id}`}
                            style={{ fontSize: 11, padding: "5px 10px", color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)" }}
                            onClick={() => handleDelete(r.id)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role hint */}
      {!showActions && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, textAlign: "center" }}>
          {capability.canCreate
            ? "👤 Analyst — edit/delete requires Admin role."
            : "🔒 Viewer mode — read-only access."}
        </p>
      )}
    </div>
  );
}
