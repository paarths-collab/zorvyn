"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";
import RecordForm from "./RecordForm";

/**
 * Modal for editing an existing financial record (Admin only).
 * Props:
 *   record    – the full record object to pre-fill
 *   token     – JWT string
 *   onClose   – callback to close
 *   onSuccess – callback after successful update
 */
export default function EditModal({ record, token, onClose, onSuccess }) {
  const [form, setForm] = useState({
    amount:         String(record.amount),
    type:           record.type,
    category:       record.category,
    date:           record.date,
    description:    record.description    || "",
    payment_method: record.payment_method,
    reference_id:   record.reference_id   || "",
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      await apiFetch(`/records/${record.id}`, token, {
        method: "PUT",
        body: JSON.stringify({
          amount:         Number(form.amount),
          type:           form.type,
          category:       form.category,
          date:           form.date,
          description:    form.description    || null,
          payment_method: form.payment_method,
          reference_id:   form.reference_id   || null,
        }),
      });
      onSuccess();
    } catch (e) { setErr(e.message); }
    finally    { setSaving(false); }
  }

  return (
    <div className="modal-overlay" id="edit-modal-overlay"
      onClick={(e) => e.target.id === "edit-modal-overlay" && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3>
            Edit Record{" "}
            <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 15 }}>#{record.id}</span>
          </h3>
          <button id="close-edit-modal" onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--muted)" }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <RecordForm value={form} onChange={setForm} />
          {err && <div className="msg-error" style={{ marginTop: 12 }}>{err}</div>}
          <button id="submit-edit-record" className="btn-black-pill"
            type="submit" style={{ marginTop: 20 }} disabled={saving}>
            {saving ? "Saving…" : "Update Record"}
          </button>
        </form>
      </div>
    </div>
  );
}
