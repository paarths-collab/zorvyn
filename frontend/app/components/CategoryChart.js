import { fmt, fmtN } from "../lib/api";

/** Horizontal bar chart — categories sorted by total amount, top 8 shown */
export default function CategoryChart({ data }) {
  if (!data?.length) {
    return (
      <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
        No category data yet
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.amount - a.amount).slice(0, 8);
  const max    = sorted[0]?.amount || 1;

  return (
    <div>
      {sorted.map((row) => (
        <div key={row.category} className="cat-bar-row">
          <div className="cat-bar-label">{fmtN(row.category)}</div>
          <div className="cat-bar-track">
            <div className="cat-bar-fill" style={{ width: `${(row.amount / max) * 100}%` }} />
          </div>
          <div className="cat-bar-amount">{fmt(row.amount)}</div>
        </div>
      ))}
    </div>
  );
}
