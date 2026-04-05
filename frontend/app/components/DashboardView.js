import { fmt, fmtN, INCOME_CATS, EXPENSE_CATS } from "../lib/api";
import { TypeBadge } from "./Badge";
import TrendChart from "./TrendChart";
import CategoryChart from "./CategoryChart";
import {
  IncomeExpenseDonut,
  MonthlyBarsChart,
  RunningBalanceChart,
  CategorySplitChart,
} from "./AnalyticsCharts";

/* ── small chart header helper ─────────────────────── */
function ChartHeader({ title, legend }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <h4 style={{ margin: 0, fontSize: 14 }}>{title}</h4>
      {legend && (
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--muted)" }}>
          {legend.map(({ color, label }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: color, display: "inline-block" }} />
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main dashboard view.
 * Props: summary, categories, trends, recent, loading
 * All data is fetched by the parent (page.js) and passed down.
 */
export default function DashboardView({ summary, categories, trends, recent, loading }) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "70px 0", color: "var(--muted)", fontSize: 14 }}>
        Loading dashboard data…
      </div>
    );
  }

  const income  = summary?.total_income  ?? 0;
  const expense = summary?.total_expense ?? 0;
  const net     = summary?.net_balance   ?? 0;
  const savingsRate = income > 0 ? Math.max(0, ((income - expense) / income) * 100) : null;

  return (
    <div>

      {/* ── KPI Cards ───────────────────────────────── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Income</div>
          <div className="kpi-value" style={{ color: "#16a34a" }}>{fmt(income)}</div>
          <div className="kpi-sub">All-time earnings</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Expenses</div>
          <div className="kpi-value" style={{ color: "#dc2626" }}>{fmt(expense)}</div>
          <div className="kpi-sub">All-time spending</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Net Balance</div>
          <div className="kpi-value" style={{ color: net >= 0 ? "#16a34a" : "#dc2626" }}>
            {net >= 0 ? "+" : ""}{fmt(net)}
          </div>
          <div className="kpi-sub">{net >= 0 ? "Surplus" : "Deficit"}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Savings Rate</div>
          <div className="kpi-value" style={{ color: savingsRate === null ? "var(--muted)" : savingsRate >= 20 ? "#16a34a" : savingsRate >= 0 ? "#f59e0b" : "#dc2626" }}>
            {savingsRate === null ? "—" : `${savingsRate.toFixed(1)}%`}
          </div>
          <div className="kpi-sub">
            {savingsRate === null ? "No income recorded" : savingsRate >= 20 ? "Healthy surplus" : savingsRate > 0 ? "Tight margin" : "Over-spending"}
          </div>
        </div>
      </div>

      {/* ── Row 1: Trend line + Category bars ───────── */}
      <div className="charts-row">
        <div className="panel">
          <ChartHeader
            title="Monthly Trends"
            legend={[
              { color: "#22c55e", label: "Income"  },
              { color: "#ef4444", label: "Expense" },
            ]}
          />
          <TrendChart data={trends} />
        </div>

        <div className="panel">
          <ChartHeader title="Category Breakdown" />
          <CategoryChart data={categories} />
        </div>
      </div>

      {/* ── Row 2: Donut + Grouped bars + Running balance ── */}
      <div className="charts-analytics-row">

        {/* Donut */}
        <div className="panel">
          <ChartHeader title="Income / Expense Split" />
          <IncomeExpenseDonut income={income} expense={expense} />
        </div>

        {/* Grouped monthly bars */}
        <div className="panel">
          <ChartHeader
            title="Monthly Comparison"
            legend={[
              { color: "#4ade80", label: "Income"  },
              { color: "#f87171", label: "Expense" },
            ]}
          />
          <MonthlyBarsChart data={trends} />
        </div>

        {/* Cumulative balance */}
        <div className="panel">
          <ChartHeader title="Cumulative Balance" />
          <RunningBalanceChart data={trends} />
        </div>
      </div>

      {/* ── Row 3: Category split ───────────────────── */}
      <div className="panel">
        <ChartHeader title="Income vs Expense Categories" />
        <CategorySplitChart
          categories={categories}
          incomeCats={INCOME_CATS}
          expenseCats={EXPENSE_CATS}
        />
      </div>

      {/* ── Recent Transactions ─────────────────────── */}
      <div className="panel" style={{ padding: 0, overflow: "hidden", marginTop: 14 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
          <h4 style={{ margin: 0, fontSize: 14 }}>Recent Transactions</h4>
        </div>

        {!recent?.length ? (
          <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "36px 0" }}>
            No transactions yet — add your first record using the button above!
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
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
                    <td style={{ fontWeight: 700, color: r.type === "income" ? "#16a34a" : "#dc2626" }}>
                      {r.type === "income" ? "+" : "-"}{fmt(r.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
