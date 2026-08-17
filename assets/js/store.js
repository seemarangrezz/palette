/* ==========================================================================
   STORE — the single source of truth for every page on the site.

   Nothing about the artwork is hard-coded in the HTML. Every page boots
   by calling Store.boot(), which loads content from the best source
   available, in this order:

     1. CLOUD DATABASE   — if config.js has a Supabase project connected.
                           Shared by everyone, editable from any device.
     2. THIS BROWSER     — IndexedDB, for when no database is connected yet
                           (or the network is down). Perfect for previewing.
     3. data.js          — the bundled starter content, so a fresh visitor
                           always sees a complete site rather than nothing.

   TWO STATES, ALWAYS
     draft      what the artist is working on — only visible in the admin
     published  what the world sees

   Editing writes to the draft. Pressing "Publish" copies draft → published.
   That's the whole mental model, and it matches how the artist already
   thinks: work in private, then put it on the wall.
   ========================================================================== */

const Store = (() => {
  const PW_KEY = "gallery_admin_pw_hash_v1";
  const SESSION_KEY = "gallery_admin_session_v1";
  const LEGACY_DRAFT_KEY = "gallery_admin_draft_v1";
  const DEFAULT_PASSWORD = "changeme123";

  /* In-memory content, so every getter stays synchronous and every page
     renders in one pass without waterfalls. */
  let current = null;
  let mode = "local";        // "cloud" | "local"
  let editing = false;       // true in the admin (reads the draft)
  let lastSavedAt = null;
  let dirty = false;
  let bootError = "";
  let livePublishedJSON = null;   // snapshot of what visitors currently see

  function defaults() {
    return {
      site: JSON.parse(JSON.stringify(SITE_DATA)),
      artworks: JSON.parse(JSON.stringify(ARTWORKS)),
      categories: JSON.parse(JSON.stringify(CATEGORIES)),
    };
  }

  /* Fill in any field added after the artist's content was first saved,
     so an upgrade never leaves a page rendering "undefined". */
  function normalise(state) {
    const base = defaults();
    const s = state && state.site ? JSON.parse(JSON.stringify(state)) : base;
    s.site = Object.assign({}, base.site, s.site || {});
    s.site.contact = Object.assign({}, base.site.contact, s.site.contact || {});
    s.site.bio = Object.assign({}, base.site.bio, s.site.bio || {});
    s.site.cv = Object.assign({}, base.site.cv, s.site.cv || {});
    if (!s.site.portraitImage) s.site.portraitImage = "assets/images/artworks/clay-vessel-of-memory.svg";
    if (typeof s.site.cvFile !== "string") s.site.cvFile = "";
    s.artworks = (s.artworks || base.artworks).map((a) =>
      Object.assign({ images: [], published: true, featured: false, status: "available" }, a)
    );
    s.categories = s.categories || base.categories;
    return s;
  }

  /* ------------------------------------------------------------ boot */
  async function boot(options = {}) {
    editing = Boolean(options.admin);
    mode = Cloud.enabled ? "cloud" : "local";

    try {
      if (mode === "cloud") {
        /* In the admin we want the draft; visitors get the published copy. */
        const wanted = editing && Cloud.isSignedIn() ? "draft" : "published";
        let row = await Cloud.getState(wanted);
        if (!row && wanted === "draft") row = await Cloud.getState("published");
        if (row) {
          current = normalise(row.data);
          lastSavedAt = row.updatedAt;
          const live = wanted === "published" ? row : await Cloud.getState("published").catch(() => null);
          livePublishedJSON = live ? JSON.stringify(normalise(live.data)) : null;
          return current;
        }
        /* Empty project — seed it from the bundled starter content so the
           artist opens the dashboard to a working site, not a blank page. */
        current = normalise(defaults());
        if (editing && Cloud.isSignedIn()) {
          await Cloud.putState("draft", current);
          await Cloud.putState("published", current);
          livePublishedJSON = JSON.stringify(current);
        }
        return current;
      }
    } catch (e) {
      bootError = e.message || "Could not reach the database.";
      /* Fall through to local content rather than showing a broken site. */
    }

    /* ---- local mode ---- */
    const wanted = editing ? "draft" : "published";
    let local = await Media.getLocalState(wanted).catch(() => null);
    if (!local && editing) local = await Media.getLocalState("published").catch(() => null);
    if (!local) local = migrateLegacyDraft();
    current = normalise(local || defaults());
    const live = await Media.getLocalState("published").catch(() => null);
    livePublishedJSON = live ? JSON.stringify(normalise(live)) : null;
    return current;
  }

  /* Anything saved by the previous localStorage-only version is carried
     over automatically the first time the new site loads. */
  function migrateLegacyDraft() {
    try {
      const raw = localStorage.getItem(LEGACY_DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      Media.setLocalState("draft", parsed);
      Media.setLocalState("published", parsed);
      localStorage.removeItem(LEGACY_DRAFT_KEY);
      return parsed;
    } catch (e) {
      return null;
    }
  }

  /* ------------------------------------------------------------ reads */
  function ensure() {
    if (!current) current = normalise(defaults());
    return current;
  }
  function getSite() {
    return ensure().site;
  }
  function getCategories() {
    return ensure().categories;
  }
  /* Site pages get only published artworks; the admin passes true. */
  function getArtworks(includeHidden) {
    const all = ensure().artworks;
    return includeHidden ? all : all.filter((a) => a.published !== false);
  }
  function getArtwork(id) {
    return getArtworks(true).find((a) => a.id === id) || null;
  }

  /* ------------------------------------------------------------ writes */
  let saveTimer = null;
  const listeners = [];

  function onSaveStateChange(fn) {
    listeners.push(fn);
  }
  function emit(status, detail) {
    listeners.forEach((fn) => fn(status, detail));
  }

  /* Debounced so typing in a textarea doesn't hammer the database. */
  function queueSave() {
    dirty = true;
    emit("dirty");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveDraft(), 700);
  }

  async function saveDraft() {
    clearTimeout(saveTimer);
    emit("saving");
    try {
      if (mode === "cloud" && Cloud.isSignedIn()) {
        await Cloud.putState("draft", current);
      } else {
        await Media.setLocalState("draft", current);
      }
      dirty = false;
      lastSavedAt = new Date().toISOString();
      emit("saved", lastSavedAt);
      return true;
    } catch (e) {
      emit("error", e.message);
      return false;
    }
  }

  function saveSite(site) {
    ensure().site = site;
    queueSave();
  }
  function saveArtworks(artworks) {
    ensure().artworks = artworks;
    queueSave();
  }
  function saveCategories(categories) {
    ensure().categories = categories;
    queueSave();
  }

  /* ------------------------------------------------------------ publish */
  async function publish() {
    await saveDraft();
    if (mode === "cloud" && Cloud.isSignedIn()) {
      await Cloud.putState("published", current);
    } else {
      await Media.setLocalState("published", current);
    }
    livePublishedJSON = JSON.stringify(current);
    emit("published", new Date().toISOString());
    return true;
  }

  async function discardDraft() {
    let published = null;
    if (mode === "cloud") {
      const row = await Cloud.getState("published").catch(() => null);
      published = row ? row.data : null;
    } else {
      published = await Media.getLocalState("published").catch(() => null);
    }
    current = normalise(published || defaults());
    livePublishedJSON = published ? JSON.stringify(current) : null;
    if (mode === "cloud" && Cloud.isSignedIn()) await Cloud.putState("draft", current);
    else await Media.setLocalState("draft", current);
    return current;
  }

  /* Has the draft drifted from what's live? Drives the "unpublished
     changes" badge so the artist is never unsure what visitors can see. */
  function hasUnpublishedChanges() {
    if (!current) return false;
    if (livePublishedJSON === null) return true;   // nothing published yet
    return livePublishedJSON !== JSON.stringify(current);
  }

  /* ------------------------------------------------------------ auth */
  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function ensurePasswordSeeded() {
    if (!localStorage.getItem(PW_KEY)) {
      localStorage.setItem(PW_KEY, await sha256(DEFAULT_PASSWORD));
    }
  }

  /* Cloud mode uses a real account (email + password, hashed on Supabase's
     side, with proper session tokens). Local mode falls back to a
     browser-only passphrase — fine for a private preview, and the admin UI
     says so plainly rather than pretending otherwise. */
  async function signIn(email, password) {
    if (mode === "cloud") {
      await Cloud.signIn(email, password);
      sessionStorage.setItem(SESSION_KEY, "1");
      return true;
    }
    await ensurePasswordSeeded();
    const ok = (await sha256(password)) === localStorage.getItem(PW_KEY);
    if (ok) sessionStorage.setItem(SESSION_KEY, "1");
    return ok;
  }

  async function setPassword(pw) {
    localStorage.setItem(PW_KEY, await sha256(pw));
  }

  function isLoggedIn() {
    if (mode === "cloud") return Cloud.isSignedIn();
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }

  async function signOut() {
    sessionStorage.removeItem(SESSION_KEY);
    if (mode === "cloud") await Cloud.signOut();
  }

  /* ------------------------------------------------------------ utils */
  function slugify(str) {
    return (
      String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ||
      "artwork-" + Date.now()
    );
  }

  function download(filename, text, type) {
    const blob = new Blob([text], { type: type || "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* A full JSON backup — the artist's safety net, and how content moves
     between a local preview and a connected database. */
  function downloadBackup() {
    download(
      `artist-site-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ exportedAt: new Date().toISOString(), state: current }, null, 2)
    );
  }

  async function restoreBackup(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const incoming = parsed.state || parsed;
    if (!incoming.site || !incoming.artworks) throw new Error("That doesn't look like a site backup file.");
    current = normalise(incoming);
    await saveDraft();
    return current;
  }

  /* Kept for the static-hosting workflow: writes the current content back
     out as data.js, so a site with no database can still be published by
     replacing one file. */
  function exportDataJS() {
    return `/* SITE DATA — exported from the Studio Admin on ${new Date().toISOString()} */

const SITE_DATA = ${JSON.stringify(getSite(), null, 2)};

const CATEGORIES = ${JSON.stringify(getCategories(), null, 2)};

const ARTWORKS = ${JSON.stringify(getArtworks(true), null, 2)};
`;
  }

  function downloadExport() {
    download("data.js", exportDataJS(), "text/javascript");
  }

  return {
    boot,
    get mode() { return mode; },
    get bootError() { return bootError; },
    get isDirty() { return dirty; },
    get lastSavedAt() { return lastSavedAt; },
    getSite, getArtworks, getArtwork, getCategories,
    saveSite, saveArtworks, saveCategories, saveDraft,
    publish, discardDraft, hasUnpublishedChanges, onSaveStateChange,
    signIn, signOut, isLoggedIn, setPassword,
    slugify, downloadExport, exportDataJS, downloadBackup, restoreBackup,
  };
})();
