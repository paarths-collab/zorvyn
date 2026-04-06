"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, CAPS, capabilityFromPermissions, parseJwt } from "./lib/api";
import { RoleBadge } from "./components/Badge";
import AuthScreen    from "./components/AuthScreen";
import DashboardView from "./components/DashboardView";
import RecordsView   from "./components/RecordsView";
import UsersView     from "./components/UsersView";
import CreateModal   from "./components/CreateModal";

/**
 * Root application shell.
 * Manages auth state, active tab, and dashboard data.
 * All view rendering is delegated to child components.
 */
export default function HomePage() {
  /* ── Auth state ──────────────────────────────────── */
  const [token, setToken] = useState("");
  const [user,  setUser]  = useState(null);
  const [effectivePermissions, setEffectivePermissions] = useState([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  /* ── Dashboard data ──────────────────────────────── */
  const [summary,    setSummary]    = useState(null);
  const [categories, setCategories] = useState([]);
  const [trends,     setTrends]     = useState([]);
  const [recent,     setRecent]     = useState([]);
  const [loading,    setLoading]    = useState(false);

  /* ── UI state ────────────────────────────────────── */
  const [activeTab,  setActiveTab]  = useState("dashboard");
  const [showCreate, setShowCreate] = useState(false);
  const [error,      setError]      = useState("");

  /* ── Derived capabilities from role ──────────────── */
  const capability = useMemo(
    () => capabilityFromPermissions(effectivePermissions, user?.role),
    [effectivePermissions, user]
  );

  const loadCurrentUser = useCallback(async (tk, fallbackDecoded = null) => {
    if (!tk) {
      setPermissionsLoaded(false);
      return;
    }
    try {
      const me = await apiFetch("/auth/me", tk);
      setUser({ id: me.id, role: me.role, fullName: me.full_name });
      setEffectivePermissions(Array.isArray(me.effective_permissions) ? me.effective_permissions : []);
    } catch {
      if (fallbackDecoded?.role && fallbackDecoded?.user_id) {
        setUser({ id: fallbackDecoded.user_id, role: fallbackDecoded.role, fullName: fallbackDecoded.full_name });
      }
      setEffectivePermissions([]);
    } finally {
      setPermissionsLoaded(true);
    }
  }, []);

  /* ── Restore session on mount ────────────────────── */
  useEffect(() => {
    const t = window.localStorage.getItem("token");
    if (!t) {
      setPermissionsLoaded(false);
      return;
    }
    const d = parseJwt(t);
    if (!d?.role || !d?.user_id) { window.localStorage.removeItem("token"); return; }
    setPermissionsLoaded(false);
    setToken(t);
    loadCurrentUser(t, d);
  }, [loadCurrentUser]);

  /* ── Load /analytics/dashboard when token is set ─── */
  const loadDashboard = useCallback(async (tk) => {
    if (!tk) return;
    setLoading(true);
    try {
      const dash = await apiFetch("/analytics/dashboard", tk);
      setSummary(dash.summary);
      setCategories(dash.categories);
      setTrends(dash.trends);
      setRecent(dash.recent_transactions);
    } catch (e) { setError(e.message); }
    finally    { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!token || !permissionsLoaded) return;
    if (capability.canViewAnalytics === false) {
      setSummary(null);
      setCategories([]);
      setTrends([]);
      setRecent([]);
      setError("");
      return;
    }
    loadDashboard(token);
  }, [token, permissionsLoaded, loadDashboard, capability.canViewAnalytics]);

  /* ── Handlers ────────────────────────────────────── */
  function handleLogin(newToken, decoded) {
    window.localStorage.setItem("token", newToken);
    setPermissionsLoaded(false);
    setToken(newToken);
    loadCurrentUser(newToken, decoded);
  }

  function logout() {
    window.localStorage.removeItem("token");
    setToken(""); setUser(null);
    setEffectivePermissions([]);
    setPermissionsLoaded(false);
    setSummary(null); setCategories([]); setTrends([]); setRecent([]);
    setActiveTab("dashboard"); setError("");
  }

  /* ── Not logged in — show auth screen ───────────── */
  if (!token || !user) return <AuthScreen onLogin={handleLogin} />;

  /* ── Tab definitions (Users tab only for admin) ──── */
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "records",   label: "Records"   },
    ...(capability.canManageUsers ? [{ id: "users", label: "Users" }] : []),
  ];

  // First letter of the user's name for the avatar
  const avatarLetter = (user.fullName || "U").charAt(0).toUpperCase();

  return (
    <main className="page">

      {/* Create Record Modal — rendered at app root to overlay everything */}
      {showCreate && (
        <CreateModal
          token={token}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            if (capability.canViewAnalytics) loadDashboard(token);
          }}
        />
      )}

      <section className="shell">

        {/* ── Top Bar ─────────────────────────────────── */}
        <header className="topbar">
          {/* Brand */}
          <div>
            <div className="brand">Zorvyn</div>
            <div className="tag">Role-based finance control room</div>
          </div>

          {/* Tab navigation */}
          <nav className="tabs" role="tablist">
            {tabs.map((t) => (
              <button key={t.id} id={`tab-${t.id}`} role="tab"
                className={`tab ${activeTab === t.id ? "active" : ""}`}
                onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>

          {/* Right controls */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>

            {/* Context action button */}
            {(capability.canCreate || capability.canManageUsers) && (
              <button id="open-create-modal" className="btn btn-primary"
                onClick={() => {
                  if (activeTab === "users" && capability.canManageUsers) {
                    window.dispatchEvent(new Event("open-add-user"));
                    return;
                  }
                  if (capability.canCreate) setShowCreate(true);
                }}
                style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {activeTab === "users" && capability.canManageUsers ? "+ Add User" : "+ Add Record"}
              </button>
            )}

            {/* User chip — avatar + name + role / logout */}
            <div style={{
              display: "flex", alignItems: "center", gap: 0,
              border: "1px solid var(--line)", borderRadius: 999,
              background: "#fff", overflow: "hidden",
            }}>
              {/* Avatar initial */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--ink)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, flexShrink: 0, margin: 2,
              }}>
                {avatarLetter}
              </div>

              {/* Name + role */}
              <div style={{ padding: "0 10px 0 8px", display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2, whiteSpace: "nowrap" }}>
                  {user.fullName || "User"}
                </span>
                <RoleBadge role={user.role} />
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 28, background: "var(--line)", flexShrink: 0 }} />

              {/* Logout */}
              <button id="logout-btn" onClick={logout}
                title="Logout"
                style={{
                  border: "none", background: "none", cursor: "pointer",
                  padding: "0 14px", height: 40, display: "flex",
                  alignItems: "center", color: "var(--muted)",
                  transition: "color 0.18s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--danger)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted)"}
              >
                {/* Power-off icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>

          </div>
        </header>

        {/* Global error banner */}
        {error && <div className="msg-error" style={{ marginTop: 14 }}>{error}</div>}

        {/* ── View Switcher ────────────────────────────── */}
        <div style={{ marginTop: 20 }}>
          {activeTab === "dashboard" && (
            capability.canViewAnalytics ? (
              <DashboardView
                summary={summary}
                categories={categories}
                trends={trends}
                recent={recent}
                loading={loading}
              />
            ) : (
              <div className="panel" style={{ textAlign: "center", padding: "32px 20px", color: "var(--muted)" }}>
                You do not have permission to view analytics.
              </div>
            )
          )}

          {activeTab === "records" && (
            <RecordsView token={token} capability={capability} />
          )}

          {activeTab === "users" && capability.canManageUsers && (
            <UsersView token={token} />
          )}
        </div>

      </section>
    </main>
  );
}
