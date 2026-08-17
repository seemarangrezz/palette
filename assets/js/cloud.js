/* ==========================================================================
   CLOUD — a tiny, dependency-free client for Supabase (the free database
   and file-storage service this site can be connected to).

   No SDK, no build step, no npm — just fetch() calls against Supabase's
   REST endpoints, so the site stays a plain set of files you can host
   anywhere (GitHub Pages, Netlify, Vercel, a shared folder).

   Three things live in the cloud when it's connected:
     1. AUTH     — a real email + password login (Supabase Auth)
     2. CONTENT  — one row of JSON per state: "draft" and "published"
     3. MEDIA    — uploaded photos in a public storage bucket

   Everything degrades gracefully: if no project is configured in
   config.js, Cloud.enabled is false and the site falls back to
   browser-only storage. Nothing breaks.
   ========================================================================== */

const Cloud = (() => {
  const TOKEN_KEY = "gallery_cloud_session_v1";

  const url = () => (APP_CONFIG.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = () => APP_CONFIG.SUPABASE_ANON_KEY || "";
  const enabled = () => APP_CONFIG.CLOUD_ENABLED;

  /* ------------------------------------------------------------ session */
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem(TOKEN_KEY) || "null");
  } catch (e) {
    session = null;
  }

  function saveSession(s) {
    session = s;
    if (s) localStorage.setItem(TOKEN_KEY, JSON.stringify(s));
    else localStorage.removeItem(TOKEN_KEY);
  }

  function isSignedIn() {
    return Boolean(session && session.access_token);
  }

  function currentEmail() {
    return session?.user?.email || "";
  }

  /* Headers for anonymous (public, read-only) requests. */
  function anonHeaders(extra) {
    return Object.assign(
      { apikey: key(), Authorization: "Bearer " + key() },
      extra || {}
    );
  }

  /* Headers for authenticated (admin, read/write) requests. */
  function authHeaders(extra) {
    const token = session?.access_token || key();
    return Object.assign(
      { apikey: key(), Authorization: "Bearer " + token },
      extra || {}
    );
  }

  /* ------------------------------------------------------------ auth */
  async function signIn(email, password) {
    const res = await fetch(`${url()}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: key(), "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        body.error_description ||
          body.msg ||
          body.message ||
          "We couldn't sign you in. Check the email and password."
      );
    }
    saveSession(body);
    return body;
  }

  async function refresh() {
    if (!session?.refresh_token) return false;
    const res = await fetch(`${url()}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: key(), "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!res.ok) {
      saveSession(null);
      return false;
    }
    saveSession(await res.json());
    return true;
  }

  async function signOut() {
    try {
      if (session?.access_token) {
        await fetch(`${url()}/auth/v1/logout`, {
          method: "POST",
          headers: authHeaders(),
        });
      }
    } catch (e) {
      /* signing out locally is what matters */
    }
    saveSession(null);
  }

  /* Retry a request once after refreshing an expired token. */
  async function withAuth(doRequest) {
    let res = await doRequest();
    if (res.status === 401 && (await refresh())) res = await doRequest();
    return res;
  }

  /* ------------------------------------------------------------ content */
  /* The whole site is two JSON documents: "published" (what the world
     sees) and "draft" (what you're working on). Simple, atomic, and it
     scales to hundreds of artworks without any schema migrations. */

  async function getState(id) {
    const headers = isSignedIn() ? authHeaders() : anonHeaders();
    const res = await withAuth(() =>
      fetch(
        `${url()}/rest/v1/site_state?id=eq.${encodeURIComponent(id)}&select=data,updated_at`,
        { headers }
      )
    );
    if (!res.ok) throw new Error("Could not read content from the database.");
    const rows = await res.json();
    if (!rows.length) return null;
    return { data: rows[0].data, updatedAt: rows[0].updated_at };
  }

  async function putState(id, data) {
    const res = await withAuth(() =>
      fetch(`${url()}/rest/v1/site_state`, {
        method: "POST",
        headers: authHeaders({
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        }),
        body: JSON.stringify({
          id,
          data,
          updated_at: new Date().toISOString(),
        }),
      })
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        res.status === 401 || res.status === 403
          ? "Your session expired. Please sign in again."
          : "Save failed. " + detail.slice(0, 160)
      );
    }
    return true;
  }

  /* ------------------------------------------------------------ media */
  /* XHR rather than fetch, purely so we can show a real progress bar. */
  function uploadFile(path, blob, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${url()}/storage/v1/object/${APP_CONFIG.BUCKET}/${path}`, true);
      xhr.setRequestHeader("apikey", key());
      xhr.setRequestHeader("Authorization", "Bearer " + (session?.access_token || key()));
      xhr.setRequestHeader("x-upsert", "true");
      if (blob.type) xhr.setRequestHeader("Content-Type", blob.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(publicUrl(path));
        } else if (xhr.status === 401 || xhr.status === 403) {
          reject(new Error("Upload not permitted — please sign in again."));
        } else {
          reject(new Error(`Upload failed (${xhr.status}). ${xhr.responseText.slice(0, 140)}`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error while uploading."));
      xhr.send(blob);
    });
  }

  function publicUrl(path) {
    return `${url()}/storage/v1/object/public/${APP_CONFIG.BUCKET}/${path}`;
  }

  async function listFiles(prefix = "") {
    const res = await withAuth(() =>
      fetch(`${url()}/storage/v1/object/list/${APP_CONFIG.BUCKET}`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          prefix,
          limit: 500,
          sortBy: { column: "created_at", order: "desc" },
        }),
      })
    );
    if (!res.ok) return [];
    const rows = await res.json();
    return rows
      .filter((r) => r.id)
      .map((r) => ({
        name: r.name,
        path: prefix ? `${prefix}/${r.name}` : r.name,
        url: publicUrl(prefix ? `${prefix}/${r.name}` : r.name),
        size: r.metadata?.size || 0,
        createdAt: r.created_at,
      }));
  }

  async function deleteFile(path) {
    const res = await withAuth(() =>
      fetch(`${url()}/storage/v1/object/${APP_CONFIG.BUCKET}/${path}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
    );
    return res.ok;
  }

  /* ------------------------------------------------------------ health */
  /* Used by the "Connection" panel so the artist gets a plain-English
     answer to "is my website actually connected?" */
  async function diagnose() {
    const out = { configured: enabled(), reachable: false, tableOk: false, bucketOk: false, signedIn: isSignedIn(), message: "" };
    if (!enabled()) {
      out.message = "No database connected — changes save to this browser only.";
      return out;
    }
    try {
      const res = await fetch(`${url()}/rest/v1/site_state?select=id&limit=1`, {
        headers: anonHeaders(),
      });
      out.reachable = true;
      out.tableOk = res.ok;
      if (!res.ok) {
        out.message = "Connected to the project, but the content table is missing. Run the setup SQL once.";
        return out;
      }
    } catch (e) {
      out.message = "Could not reach the project. Check the Project URL in config.js.";
      return out;
    }
    try {
      const res = await fetch(`${url()}/storage/v1/object/list/${APP_CONFIG.BUCKET}`, {
        method: "POST",
        headers: anonHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ prefix: "", limit: 1 }),
      });
      out.bucketOk = res.ok;
      if (!res.ok) out.message = `Storage bucket "${APP_CONFIG.BUCKET}" not found. Create it once in Supabase → Storage.`;
    } catch (e) {
      out.bucketOk = false;
    }
    if (!out.message) out.message = "Connected. Your website is live and shared.";
    return out;
  }

  return {
    get enabled() { return enabled(); },
    isSignedIn, currentEmail, signIn, signOut, refresh,
    getState, putState,
    uploadFile, deleteFile, listFiles, publicUrl,
    diagnose,
  };
})();
