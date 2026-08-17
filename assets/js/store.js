/* ==========================================================================
   STORE
   A tiny data layer sitting in front of data.js.

   Because this is a static site (built to live on GitHub Pages, with no
   server or database), the Admin Dashboard can't write files back to the
   repo directly. Instead:

     1. Admin edits are saved as a "draft" in the browser's localStorage.
     2. Every page on the site (home, portfolio, artwork, about, cv,
        contact) reads through Store.getSite() / Store.getArtworks() /
        Store.getCategories(), which return the draft if one exists,
        otherwise the published defaults from data.js.
     3. This means you can preview your edits live, in this browser,
        before publishing.
     4. When you're happy, use "Export data.js" in the admin dashboard.
        That downloads an updated data.js file — replace the one in your
        repo with it, commit, and push. That's the "publish" step for a
        static, no-backend site.

   This keeps artwork content out of the HTML entirely (nothing is
   hard-coded into the markup) while staying deployable on plain GitHub
   Pages with zero server infrastructure.
   ========================================================================== */

const Store = (() => {
  const DRAFT_KEY = "gallery_admin_draft_v1";
  const PW_KEY = "gallery_admin_pw_hash_v1";
  const SESSION_KEY = "gallery_admin_session_v1";
  const DEFAULT_PASSWORD = "changeme123";

  function readDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeDraft(draft) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function getDraft() {
    return readDraft();
  }

  function hasDraft() {
    return !!readDraft();
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
  }

  function ensureDraft() {
    let d = readDraft();
    if (!d) {
      d = {
        site: JSON.parse(JSON.stringify(SITE_DATA)),
        artworks: JSON.parse(JSON.stringify(ARTWORKS)),
        categories: JSON.parse(JSON.stringify(CATEGORIES)),
      };
      writeDraft(d);
    }
    return d;
  }

  function getSite() {
    const d = readDraft();
    return (d && d.site) ? d.site : SITE_DATA;
  }

  function getArtworks() {
    const d = readDraft();
    return (d && d.artworks) ? d.artworks : ARTWORKS;
  }

  function getCategories() {
    const d = readDraft();
    return (d && d.categories) ? d.categories : CATEGORIES;
  }

  function saveSite(site) {
    const d = ensureDraft();
    d.site = site;
    writeDraft(d);
  }

  function saveArtworks(artworks) {
    const d = ensureDraft();
    d.artworks = artworks;
    writeDraft(d);
  }

  function saveCategories(categories) {
    const d = ensureDraft();
    d.categories = categories;
    writeDraft(d);
  }

  function slugify(str) {
    return String(str).toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || ("artwork-" + Date.now());
  }

  /* ---------- auth ---------- */
  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function ensurePasswordSeeded() {
    if (!localStorage.getItem(PW_KEY)) {
      const hash = await sha256(DEFAULT_PASSWORD);
      localStorage.setItem(PW_KEY, hash);
    }
  }

  async function checkPassword(pw) {
    await ensurePasswordSeeded();
    const hash = await sha256(pw);
    return hash === localStorage.getItem(PW_KEY);
  }

  async function setPassword(pw) {
    const hash = await sha256(pw);
    localStorage.setItem(PW_KEY, hash);
  }

  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }

  function login() {
    sessionStorage.setItem(SESSION_KEY, "1");
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  /* ---------- export ---------- */
  function exportDataJS() {
    const site = getSite();
    const artworks = getArtworks();
    const categories = getCategories();
    return `/* ==========================================================================
   SITE DATA — exported from the Admin Dashboard on ${new Date().toISOString()}
   Replace /assets/js/data.js in your repository with this file, then
   commit and push to publish these changes to your live GitHub Pages site.
   ========================================================================== */

const SITE_DATA = ${JSON.stringify(site, null, 2)};

const CATEGORIES = ${JSON.stringify(categories, null, 2)};

const ARTWORKS = ${JSON.stringify(artworks, null, 2)};
`;
  }

  function downloadExport() {
    const text = exportDataJS();
    const blob = new Blob([text], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.js";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return {
    getSite, getArtworks, getCategories,
    saveSite, saveArtworks, saveCategories,
    getDraft, hasDraft, clearDraft, ensureDraft,
    slugify,
    checkPassword, setPassword, isLoggedIn, login, logout,
    downloadExport, exportDataJS,
  };
})();
