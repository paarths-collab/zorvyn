"use client";

import { useEffect } from "react";
import { INCOME_CATS, EXPENSE_CATS, PAY_METHODS, fmtN } from "../lib/api";

/**
 * Shared form used by both CreateModal and EditModal.
 * Props:
 *   value    – current form state object
 *   onChange – setter (receives next state object)
 */
export default function RecordForm({ value, onChange }) {
  const cats = value.type === "income" ? INCOME_CATS : EXPENSE_CATS;
  const set  = (field) => (e) => onChange({ ...value, [field]: e.target.value });

  // Auto-fix category when type flips
  useEffect(() => {
    if (!cats.includes(value.category)) {
      onChange({ ...value, category: cats[0] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.type]);

  return (
    <div style={{ display: "grid", gap: 12 }}>

      {/* Type toggle */}
      <div className="form-row">
        <label className="filter-label">Type</label>
        <div style={{ display: "flex", gap: 8 }}>
          {["income", "expense"].map((t) => (
            <button key={t} type="button"
              id={`type-toggle-${t}`}
              onClick={() => onChange({ ...value, type: t })}
              style={{
                flex: 1, padding: "10px", border: "2px solid", borderRadius: 10,
                cursor: "pointer", fontWeight: 700, fontSize: 13,
                borderColor: value.type === t ? (t === "income" ? "#22c55e" : "#ef4444") : "var(--line)",
                background:  value.type === t ? (t === "income" ? "#f0fdf4" : "#fef2f2") : "#fff",
                color:       value.type === t ? (t === "income" ? "#16a34a" : "#dc2626") : "var(--muted)",
              }}>
              {t === "income" ? "↑ Income" : "↓ Expense"}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="form-row">
        <label className="filter-label">Amount ($)</label>
        <input className="input" id="rec-amount"
          type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*"
          placeholder="0.00" value={value.amount} onChange={set("amount")} required />
      </div>

      {/* Category */}
      <div className="form-row">
        <label className="filter-label">Category</label>
        <select className="select" id="rec-category" value={value.category} onChange={set("category")}>
          {cats.map((c) => <option key={c} value={c}>{fmtN(c)}</option>)}
        </select>
      </div>

      {/* Date */}
      <div className="form-row">
        <label className="filter-label">Date</label>
        <input className="input" id="rec-date" type="date"
          value={value.date} onChange={set("date")} required />
      </div>

      {/* Payment Method */}
      <div className="form-row">
        <label className="filter-label">Payment Method</label>
        <select className="select" id="rec-payment" value={value.payment_method} onChange={set("payment_method")}>
          {PAY_METHODS.map((m) => <option key={m} value={m}>{fmtN(m)}</option>)}
        </select>
      </div>

      {/* Reference ID */}
      <div className="form-row">
        <label className="filter-label">Reference ID <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
        <input className="input" id="rec-ref"
          placeholder="INV-2026-001  /  TXN-12345"
          value={value.reference_id} onChange={set("reference_id")} />
      </div>

      {/* Description */}
      <div className="form-row">
        <label className="filter-label">Description <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
        <textarea className="input" id="rec-desc" rows={3}
          placeholder="Brief description of this transaction…"
          value={value.description} onChange={set("description")} />
      </div>

    </div>
  );
}
