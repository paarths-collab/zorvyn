import { fmtN } from "../lib/api";

/** Badge showing income (green) or expense (red) with arrow */
export function TypeBadge({ type }) {
  return (
    <span className={`badge badge-${type}`}>
      {type === "income" ? "↑" : "↓"} {fmtN(type)}
    </span>
  );
}

/** Coloured role badge — admin=blue, analyst=amber, viewer=slate */
export function RoleBadge({ role }) {
  return <span className={`badge badge-${role}`}>{fmtN(role)}</span>;
}
