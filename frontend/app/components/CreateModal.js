"use client";

import { useState } from "react";
import { apiFetch, EMPTY_RECORD, todayStr } from "../lib/api";
import RecordForm from "./RecordForm";

/**
 * Modal for creating a new financial record.
 * Props:
 *   token      – JWT string
 *   onClose    – callback to close the modal
 *   onSuccess  – callback after successful save, used to refresh parent data
 */
export default function CreateModal({ token, onClose, onSuccess }) {
  const [form,   setForm]   = useState({ ...EMPTY_RECORD, date: todayStr() });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      await apiFetch("/records/", token, {
        method: "POST",
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
    <div className="modal-overlay" id="create-modal-overlay"
      onClick={(e) => e.target.id === "create-modal-overlay" && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3>Add New Record</h3>
          <button id="close-create-modal" onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--muted)" }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <RecordForm value={form} onChange={setForm} />
          {err && <div className="msg-error" style={{ marginTop: 12 }}>{err}</div>}
          <button id="submit-create-record" className="btn-black-pill"
            type="submit" style={{ marginTop: 20 }} disabled={saving}>
            {saving ? "Saving…" : "Save Record"}
          </button>
        </form>
      </div>
    </div>
  );
}
