import { fmt } from "../lib/api";

/** Shared empty-state placeholder used by every chart below */
function EmptyState({ msg = "Not enough data yet" }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: 140, color: "var(--muted)", fontSize: 13,
    }}>
      {msg}
    </div>
  );
}

/**
 * 1. INCOME vs EXPENSE DONUT
 * Shows the income/expense split as a ring with a legend.
 * Props: income, expense  (numbers)
 */
export function IncomeExpenseDonut({ income, expense }) {
  const total    = (income || 0) + (expense || 0);
  const net      = (income || 0) - (expense || 0);
  const R = 46, CX = 70, CY = 70;
  const circ     = 2 * Math.PI * R;
  const incomeArc = total > 0 ? (income / total) * circ : 0;
  const expenseArc = total > 0 ? (expense / total) * circ : 0;

  if (total === 0) return <EmptyState msg="No financial data yet" />;

  const pct = (v) => total > 0 ? ((v / total) * 100).toFixed(1) + "%" : "—";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      {/* Ring */}
      <svg viewBox="0 0 140 140" style={{ width: 128, flexShrink: 0 }}>
        {/* Track */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f3f4f6" strokeWidth={15} />

        {/* Expense arc (laid down first so income overlaps) */}
        {expense > 0 && (
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#fca5a5" strokeWidth={15}
            strokeDasharray={`${expenseArc} ${circ}`}
            strokeDashoffset={-incomeArc}
            transform={`rotate(-90 ${CX} ${CY})`} />
        )}

        {/* Income arc */}
        {income > 0 && (
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#4ade80" strokeWidth={15}
            strokeDasharray={`${incomeArc} ${circ}`}
            transform={`rotate(-90 ${CX} ${CY})`} />
        )}

        {/* Centre label */}
        <text x={CX} y={CY - 7} textAnchor="middle" fontSize="9.5"
          fontWeight="600" fill="#6b7280" letterSpacing="0.04em">NET</text>
        <text x={CX} y={CY + 9} textAnchor="middle" fontSize="13"
          fontWeight="800" fill={net >= 0 ? "#16a34a" : "#dc2626"}>
          {net >= 0 ? "+" : "–"}${Math.abs(net).toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Income */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Income</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>{fmt(income)}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{pct(income)} of total</div>
        </div>

        {/* Expense */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fca5a5", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Expenses</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#dc2626", lineHeight: 1 }}>{fmt(expense)}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{pct(expense)} of total</div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. MONTHLY GROUPED BARS
 * Side-by-side bars per month — clearer for month-on-month comparison than lines.
 * Props: data  [{ period, income, expense }]
 */
export function MonthlyBarsChart({ data }) {
  if (!data?.length) return <EmptyState />;

  const W = 460, H = 130, PB = 22, PT = 8;
  const chartH = H - PT - PB;
  const maxVal  = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const n       = data.length;
  const GAP_GRP = Math.max(3, Math.floor(460 / n / 6)); // gap inside group
  const GAP_OUT = Math.max(4, Math.floor(460 / n / 5)); // gap between groups
  const groupW  = (W - GAP_OUT * (n + 1)) / n;
  const barW    = (groupW - GAP_GRP) / 2;

  const toY = (v) => PT + chartH - (v / maxVal) * chartH;
  const toH = (v) => (v / maxVal) * chartH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((pct) => {
        const y = toY(maxVal * pct);
        return <line key={pct} x1={0} y1={y} x2={W} y2={y} stroke="#f3f4f6" strokeWidth="1" />;
      })}

      {data.map((d, i) => {
        const gx   = GAP_OUT + i * (groupW + GAP_OUT);
        const incX = gx;
        const expX = gx + barW + GAP_GRP;
        const midX = gx + groupW / 2;

        return (
          <g key={i}>
            {/* Income bar */}
            {d.income > 0 && (
              <rect x={incX} y={toY(d.income)} width={barW} height={toH(d.income)}
                fill="#4ade80" rx="3" />
            )}
            {/* Expense bar */}
            {d.expense > 0 && (
              <rect x={expX} y={toY(d.expense)} width={barW} height={toH(d.expense)}
                fill="#f87171" rx="3" />
            )}
            {/* Month label */}
            {(n <= 8 || i % 2 === 0) && (
              <text x={midX} y={H - 5} textAnchor="middle" fontSize="9" fill="#9ca3af">
                {d.period.slice(2)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * 3. CUMULATIVE NET BALANCE
 * Running total of (income − expense) plotted as a coloured area line.
 * Props: data  [{ period, income, expense }]
 */
export function RunningBalanceChart({ data }) {
  if (!data?.length) return <EmptyState />;

  /* Build cumulative series */
  let running = 0;
  const series = data.map((d) => {
    running += (d.income - d.expense);
    return { period: d.period, net: running };
  });

  const W = 460, H = 120, PX = 12, PY = 10;
  const nets   = series.map((s) => s.net);
  const minNet = Math.min(...nets, 0);
  const maxNet = Math.max(...nets, 0);
  const range  = maxNet - minNet || 1;

  const chartH = H - PY * 2 - 16;
  const n      = series.length;
  const step   = n > 1 ? (W - PX * 2) / (n - 1) : 0;

  const tx  = (i) => PX + i * step;
  const ty  = (v) => PY + ((maxNet - v) / range) * chartH;
  const pts = series.map((s, i) => `${tx(i)},${ty(s.net)}`).join(" ");
  const areaPath = `${pts} ${tx(n - 1)},${ty(minNet)} ${tx(0)},${ty(minNet)}`;
  const finalColor = running >= 0 ? "#22c55e" : "#ef4444";

  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} style={{ width: "100%", overflow: "visible" }}>
      <defs>
        <linearGradient id="runGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={finalColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={finalColor} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0.25, 0.5, 0.75].map((pct) => (
        <line key={pct}
          x1={PX} y1={ty(minNet + range * pct)} x2={W - PX} y2={ty(minNet + range * pct)}
          stroke="#f3f4f6" strokeWidth="1" />
      ))}

      {/* Zero line (only when there are negative values) */}
      {minNet < 0 && (
        <line x1={PX} y1={ty(0)} x2={W - PX} y2={ty(0)}
          stroke="#d1d5db" strokeWidth="1" strokeDasharray="5 4" />
      )}

      {/* Area fill */}
      <polygon points={areaPath} fill={running >= 0 ? "url(#runGrad)" : "url(#negGrad)"} />

      {/* Line */}
      <polyline points={pts} fill="none"
        stroke={finalColor} strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots */}
      {series.map((s, i) => (
        <circle key={i} cx={tx(i)} cy={ty(s.net)} r="3.5"
          fill={s.net >= 0 ? "#22c55e" : "#ef4444"} />
      ))}

      {/* X labels */}
      {series.map((s, i) => {
        if (n > 7 && i % 2 !== 0) return null;
        return (
          <text key={`l${i}`} x={tx(i)} y={H + 14}
            textAnchor="middle" fontSize="9" fill="#9ca3af">
            {s.period.slice(2)}
          </text>
        );
      })}
    </svg>
  );
}

/**
 * 4. INCOME vs EXPENSE CATEGORY SPLIT
 * Shows top income categories (green) stacked against top expense categories (red).
 * Props: categories [{ category, amount }]
 *        INCOME_CATS, EXPENSE_CATS arrays to classify each category
 */
export function CategorySplitChart({ categories, incomeCats, expenseCats }) {
  if (!categories?.length) return <EmptyState />;

  const income  = categories.filter((c) => incomeCats.includes(c.category));
  const expense = categories.filter((c) => expenseCats.includes(c.category));
  const maxInc  = Math.max(...income.map((c) => c.amount), 1);
  const maxExp  = Math.max(...expense.map((c) => c.amount), 1);

  const Row = ({ label, amount, max, color, dir = "right" }) => {
    const pct = Math.max(2, (amount / max) * 100);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        {dir === "left" && (
          <div style={{ width: 80, textAlign: "right", fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </div>
        )}
        <div style={{ flex: 1, height: 9, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99,
            ...(dir === "left" ? { marginLeft: "auto" } : {})
          }} />
        </div>
        {dir === "right" && (
          <div style={{ width: 80, fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </div>
        )}
      </div>
    );
  };

  const topInc = [...income].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const topExp = [...expense].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const fmtN   = (s) => (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* Income cols */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
          Top Income
        </div>
        {topInc.length ? topInc.map((c) => (
          <Row key={c.category} label={fmtN(c.category)} amount={c.amount} max={maxInc} color="#4ade80" dir="right" />
        )) : <div style={{ color: "var(--muted)", fontSize: 12 }}>No income records</div>}
      </div>

      {/* Expense cols */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
          Top Expenses
        </div>
        {topExp.length ? topExp.map((c) => (
          <Row key={c.category} label={fmtN(c.category)} amount={c.amount} max={maxExp} color="#f87171" dir="right" />
        )) : <div style={{ color: "var(--muted)", fontSize: 12 }}>No expense records</div>}
      </div>
    </div>
  );
}
