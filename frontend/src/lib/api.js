// Use relative URL when accessed through nginx (port 80), absolute URL for direct access
export function getApiUrl() {
  if (typeof window !== "undefined") {
    const { hostname, port } = window.location;
    // Next dev: frontend :3000 on same machine as backend :8000
    const isLocalDev =
      (hostname === "localhost" || hostname === "127.0.0.1") && port === "3000";
    if (isLocalDev) {
      // Same-origin /api — proxied to the backend via next.config.js rewrites
      return "/api";
    }
    // LAN / production via nginx or any host: always same-origin /api
    return "/api";
  }
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env && !env.includes("localhost")) {
    return env.replace(/\/$/, "");
  }
  return "/api";
}

export async function apiFetch(path, options = {}) {
  const { method = "GET", body, token } = options;

  const headers = {
    "Content-Type": "application/json",
  };

  // Get token from options or localStorage
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem("templumis_token") : null);
  
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const apiUrl = getApiUrl();
  let res;
  try {
    res = await fetch(`${apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Could not reach the server. Ensure the backend is running, then refresh and try again."
    );
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    const err = new Error(
      typeof error.detail === "string" ? error.detail : `HTTP ${res.status}`
    );
    err.status = res.status;
    err.payload = error;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function apiLogin(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function apiGetMe(token) {
  return apiFetch("/auth/me", { token });
}

function authHeaders(extra = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("templumis_token") : null;
  const headers = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Upload supporting document for scholarship draft (multipart). */
export async function uploadScholarshipDocument(scholId, file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(
    `${getApiUrl()}/sis-lms/scholarships/applications/draft/${encodeURIComponent(scholId)}/documents`,
    { method: "POST", headers: authHeaders(), body: fd }
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(typeof error.detail === "string" ? error.detail : `HTTP ${res.status}`);
  }
  return res.json();
}

/** Upload grant proposal document (multipart). docType: abstract | methodology | dmp | supporting */
export async function uploadGrantDocument(grantId, file, docType = "supporting") {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(
    `${getApiUrl()}/sis-lms/grants/applications/${encodeURIComponent(grantId)}/documents?doc_type=${encodeURIComponent(docType)}`,
    { method: "POST", headers: authHeaders(), body: fd }
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(typeof error.detail === "string" ? error.detail : `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteGrantDocument(grantId, storageKey) {
  return apiFetch(
    `/sis-lms/grants/applications/${encodeURIComponent(grantId)}/documents/${encodeURIComponent(storageKey)}`,
    { method: "DELETE" }
  );
}

export async function fetchGrantDocumentBlob(grantId, storageKey) {
  const res = await fetch(
    `${getApiUrl()}/sis-lms/grants/applications/${encodeURIComponent(grantId)}/documents/${encodeURIComponent(storageKey)}`,
    { headers: authHeaders() }
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Could not load document" }));
    throw new Error(typeof error.detail === "string" ? error.detail : `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function deleteScholarshipDocument(scholId, storageKey) {
  return apiFetch(
    `/sis-lms/scholarships/applications/draft/${encodeURIComponent(scholId)}/documents/${encodeURIComponent(storageKey)}`,
    { method: "DELETE" }
  );
}

/** Fetch document bytes for inline preview (returns object URL — revoke when done). */
export async function fetchScholarshipDocumentBlob(previewPath) {
  const res = await fetch(`${getApiUrl()}${previewPath}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Could not load document" }));
    throw new Error(typeof error.detail === "string" ? error.detail : `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
