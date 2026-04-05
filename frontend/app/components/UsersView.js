"use client";

import { useEffect, useState } from "react";
import { apiFetch, fmtN } from "../lib/api";
import { RoleBadge } from "./Badge";

/**
 * Admin-only user management panel.
 * Lists all users with role badges and a deactivate action.
 */
export default function UsersView({ token }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPassword, setNewPassword] = useState("password123");
  const [roleDrafts, setRoleDrafts] = useState({});

  async function loadUsers(authToken = token) {
    if (!authToken) {
      setUsers([]);
      return;
    }
    setLoading(true); setError("");
    try {
      const data = await apiFetch("/users/", authToken);
      setUsers(data || []);
    } catch (e) { setError(e.message); }
    finally    { setLoading(false); }
  }

  useEffect(() => {
    loadUsers(token);
  }, [token]);

  useEffect(() => {
    function openAddUser() {
      setShowCreate(true);
    }
    window.addEventListener("open-add-user", openAddUser);
    return () => window.removeEventListener("open-add-user", openAddUser);
  }, []);

  function withRoleSuffix(email, role) {
    const raw = (email || "").trim().toLowerCase();
    if (!raw) return raw;
    const [localRaw, domainRaw] = raw.includes("@") ? raw.split("@") : [raw, "gmail.com"];
    const domain = domainRaw || "gmail.com";
    const local = (localRaw || "user").replace(/\.(admin|analyst|viewer)$/i, "");
    return `${local}.${role}@${domain}`;
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setError("");
    setCreating(true);
    const role = (roleDrafts.__new || "analyst").toLowerCase();
    const email = withRoleSuffix(newEmail, role);
    try {
      await apiFetch("/auth/register", token, {
        method: "POST",
        body: JSON.stringify({
          email,
          full_name: newFullName.trim() || null,
          password: newPassword,
        }),
      });
      setShowCreate(false);
      setNewEmail("");
      setNewFullName("");
      setNewPassword("password123");
      setRoleDrafts((prev) => ({ ...prev, __new: "analyst" }));
      await loadUsers();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleUpdate(user) {
    const nextRole = roleDrafts[user.id] || user.role;
    if (nextRole === user.role) return;
    try {
      await apiFetch(`/users/${user.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });
      await loadUsers();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleActivate(id) {
    try {
      await apiFetch(`/users/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ is_active: true }),
      });
      await loadUsers();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDeactivate(id, label) {
    if (!window.confirm(`Deactivate user "${label}"?`)) return;
    try {
      await apiFetch(`/users/${id}/deactivate`, token, { method: "POST" });
      loadUsers();
    } catch (e) { setError(e.message); }
  }

  return (
    <div>
      {error && <div className="msg-error">{error}</div>}

      {showCreate && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <h4 style={{ marginTop: 0, marginBottom: 10, fontSize: 14 }}>Add User</h4>
          <p style={{ marginTop: 0, color: "var(--muted)", fontSize: 12 }}>
            Role is assigned from email suffix: .admin, .analyst, .viewer
          </p>
          <form onSubmit={handleCreateUser} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr auto", gap: 8 }}>
            <input
              className="input-pill"
              placeholder="email (e.g. rita@gmail.com)"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
            <input
              className="input-pill"
              placeholder="full name"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
            />
            <select
              className="input-pill"
              value={roleDrafts.__new || "analyst"}
              onChange={(e) => setRoleDrafts((prev) => ({ ...prev, __new: e.target.value }))}
            >
              <option value="admin">admin</option>
              <option value="analyst">analyst</option>
              <option value="viewer">viewer</option>
            </select>
            <input
              className="input-pill"
              placeholder="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? "Adding..." : "Add"}
              </button>
              <button type="button" className="btn btn-soft" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0, fontSize: 14 }}>User Management</h4>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {loading ? "Loading…" : `${users.length} user${users.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={6}
                    style={{ textAlign: "center", color: "var(--muted)", padding: "40px", fontSize: 13 }}>
                    No users found.
                  </td>
                </tr>
              )}

              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ color: "var(--muted)", fontSize: 11 }}>#{u.id}</td>
                  <td style={{ fontWeight: 600 }}>
                    {u.full_name || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>—</span>}
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{u.email}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <RoleBadge role={u.role} />
                      <select
                        className="input-pill"
                        style={{ maxWidth: 120, height: 32, padding: "0 10px", borderRadius: 10 }}
                        value={roleDrafts[u.id] || u.role}
                        onChange={(e) => setRoleDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                      >
                        <option value="admin">admin</option>
                        <option value="analyst">analyst</option>
                        <option value="viewer">viewer</option>
                      </select>
                      <button
                        className="btn btn-soft"
                        style={{ fontSize: 11, padding: "5px 10px" }}
                        onClick={() => handleRoleUpdate(u)}
                      >
                        Save Role
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? "badge-income" : "badge-expense"}`}>
                      {u.is_active ? "● Active" : "○ Inactive"}
                    </span>
                  </td>
                  <td>
                    {u.is_active ? (
                      <button className="btn btn-soft" id={`deactivate-user-${u.id}`}
                        style={{ fontSize: 11, padding: "5px 10px", color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)" }}
                        onClick={() => handleDeactivate(u.id, u.full_name || u.email)}>
                        Deactivate
                      </button>
                    ) : (
                      <button className="btn btn-soft"
                        style={{ fontSize: 11, padding: "5px 10px" }}
                        onClick={() => handleActivate(u.id)}>
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
