/** SVG polyline-based monthly trend chart (income = green, expense = red) */
export default function TrendChart({ data }) {
  if (!data?.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 130, color: "var(--muted)", fontSize: 13 }}>
        No trend data yet — create some records!
      </div>
    );
  }

  const W = 480, H = 130, PX = 16, PY = 10;
  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const n = data.length;
  const step = n > 1 ? (W - PX * 2) / (n - 1) : 0;

  const tx = (i) => PX + i * step;
  const ty = (v) => H - PY - (v / maxVal) * (H - PY * 2 - 16);

  const iPoints = data.map((d, i) => `${tx(i)},${ty(d.income)}`).join(" ");
  const ePoints = data.map((d, i) => `${tx(i)},${ty(d.expense)}`).join(" ");
  const iArea   = `${iPoints} ${tx(n - 1)},${H - PY} ${tx(0)},${H - PY}`;

  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} style={{ width: "100%", overflow: "visible" }}>
      <defs>
        <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gridlines */}
      {[0.25, 0.5, 0.75, 1].map((pct) => (
        <line key={pct}
          x1={PX} y1={ty(maxVal * pct)} x2={W - PX} y2={ty(maxVal * pct)}
          stroke="#f3f4f6" strokeWidth="1" />
      ))}

      {/* Income area fill */}
      <polygon points={iArea} fill="url(#incG)" />

      {/* Income line */}
      <polyline points={iPoints} fill="none" stroke="#22c55e" strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Expense line */}
      <polyline points={ePoints} fill="none" stroke="#ef4444" strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Data point dots */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={tx(i)} cy={ty(d.income)}  r="3.5" fill="#22c55e" />
          <circle cx={tx(i)} cy={ty(d.expense)} r="3.5" fill="#ef4444" />
        </g>
      ))}

      {/* X-axis period labels (skip every other if dense) */}
      {data.map((d, i) => {
        if (n > 7 && i % 2 !== 0) return null;
        return (
          <text key={`lbl-${i}`} x={tx(i)} y={H + 14}
            textAnchor="middle" fontSize="9" fill="#9ca3af">
            {d.period.slice(2)}
          </text>
        );
      })}
    </svg>
  );
}
