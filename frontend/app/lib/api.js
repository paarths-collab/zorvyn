/* ─── API URL ───────────────────────────────────────── */
// Flexible API resolution:
// 1) NEXT_PUBLIC_API_URL (full URL) if provided
// 2) Browser hostname + backend port (defaults to 8000)
// This avoids auth-header loss seen with some dev rewrite proxy paths.
function resolveApiBase() {
  const explicit = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const backendPort = (process.env.NEXT_PUBLIC_BACKEND_PORT || "8000").trim();
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol || "http:";
    const host = window.location.hostname || "localhost";
    return `${protocol}//${host}:${backendPort}/api/v1`;
  }

  return `http://localhost:${backendPort}/api/v1`;
}

export const API = resolveApiBase();

function withApiBase(path) {
  const suffix = String(path || "").startsWith("/") ? String(path) : `/${String(path || "")}`;
  return `${API}${suffix}`;
}

function normalizeCollectionPath(path) {
  const p = String(path || "");
  if (p === "/records") return "/records/";
  if (p.startsWith("/records?")) return p.replace("/records?", "/records/?");
  if (p === "/users") return "/users/";
  if (p.startsWith("/users?")) return p.replace("/users?", "/users/?");
  return p;
}

function resolveToken(passedToken) {
  if (passedToken) return passedToken;
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

function isProtectedPath(path) {
  const p = String(path || "");
  return !p.startsWith("/auth/");
}

/* ─── Role Capabilities ─────────────────────────────── */
export const CAPS = {
  viewer:  { canCreate: false, canEdit: false, canDelete: false, canManageUsers: false },
  analyst: { canCreate: true,  canEdit: false, canDelete: false, canManageUsers: false },
  admin:   { canCreate: true,  canEdit: true,  canDelete: true,  canManageUsers: true  },
};

/* ─── Category / Payment Constants ─────────────────── */
export const INCOME_CATS  = ["client_payment", "product_sales", "funding", "subscription"];
export const EXPENSE_CATS = ["salary", "marketing", "rent", "travel", "utilities", "software", "subscription"];
export const ALL_CATS     = [...new Set([...INCOME_CATS, ...EXPENSE_CATS])];
export const PAY_METHODS  = ["cash", "card", "bank_transfer", "upi"];

export const EMPTY_RECORD = {
  amount: "", type: "income", category: "client_payment",
  date: "", description: "", payment_method: "bank_transfer", reference_id: "",
};

/* ─── Utility Functions ─────────────────────────────── */
export function parseJwt(t) {
  try {
    return JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return null; }
}

export async function apiFetch(path, tokenOrOpts, maybeOpts = {}) {
  // Backward-compatible signatures:
  // 1) apiFetch(path, token, opts)
  // 2) apiFetch(path, opts)
  const token = typeof tokenOrOpts === "string" ? tokenOrOpts : resolveToken();
  const opts = (tokenOrOpts && typeof tokenOrOpts === "object" && !Array.isArray(tokenOrOpts))
    ? tokenOrOpts
    : maybeOpts;

  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const normalizedPath = normalizeCollectionPath(path);

  if (isProtectedPath(normalizedPath) && !token) {
    throw new Error(`Missing auth token for ${normalizedPath}. Please log in again.`);
  }

  if (token) headers.Authorization = `Bearer ${token}`;
  const url = withApiBase(normalizedPath);

  let res;
  try {
    res = await fetch(url, { ...opts, headers });
  } catch (e) {
    throw new Error(`Network error calling ${url}: ${e?.message || "request failed"}`);
  }

  if (res.status === 204) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const detail = data?.detail || data?.error?.message || data?.message || res.statusText || "Request failed";
    throw new Error(`API ${res.status} on ${normalizedPath}: ${detail}`);
  }

  return data;
}

/** Format a number as $1,234.56 */
export const fmt = (n) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Format snake_case → Title Case */
export const fmtN = (s) =>
  (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Today's date as YYYY-MM-DD */
export const todayStr = () => new Date().toISOString().split("T")[0];
