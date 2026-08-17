/* ==========================================================================
   ADMIN — the Studio Admin dashboard.

   Written for an artist, not an engineer. Three principles run through it:

     1. NOTHING IS LOST. Every edit saves itself to a private draft the
        moment you stop typing. The bar at the top always says, in words,
        whether your work is saved and whether the public site has caught up.

     2. FILES ARE DRAGGED, NOT TYPED. There is no "image path" field
        anywhere. You drag a photo in — or click, or paste — and the site
        resizes it, uploads it, and remembers it in your Media Library.

     3. NOTHING GOES PUBLIC BY ACCIDENT. Draft and published are separate.
        You press Publish when the work is ready to be seen.
   ========================================================================== */

const state = {
  site: null,
  artworks: null,
  categories: null,
  editingId: null,
};

/* Live handles to the mounted upload components. */
const uploaders = {};

document.addEventListener("DOMContentLoaded", async () => {
  await Store.boot({ admin: true });
  loadState();
  paintLoginMode();
  wireLogin();
  if (Store.isLoggedIn()) showDashboard();
});

function loadState() {
  state.site = JSON.parse(JSON.stringify(Store.getSite()));
  state.artworks = JSON.parse(JSON.stringify(Store.getArtworks(true)));
  state.categories = JSON.parse(JSON.stringify(Store.getCategories()));
}

/* Push the working copy back into the Store, which saves it. */
function commitSite() { Store.saveSite(state.site); }
function commitArtworks() { Store.saveArtworks(state.artworks); }
function commitCategories() { Store.saveCategories(state.categories); }

/* ---------------------------------------------------------------- LOGIN */
function paintLoginMode() {
  const cloud = Store.mode === "cloud";
  const chip = document.getElementById("loginModeChip");
  const text = document.getElementById("loginModeText");
  const hint = document.getElementById("loginHint");
  const emailField = document.getElementById("emailField");

  if (cloud) {
    chip.classList.add("ok");
    text.textContent = "Connected to your database";
    emailField.hidden = false;
    document.getElementById("loginEmail").required = true;
    hint.innerHTML =
      "Sign in with the email and password from your Supabase project. You can use this dashboard from any computer or phone, and your changes appear for everyone.";
  } else {
    text.textContent = "Browser-only mode";
    emailField.hidden = true;
    hint.innerHTML =
      "No database is connected yet, so everything you do saves to this browser alone — perfect for trying things out. Default password: <strong>changeme123</strong>. " +
      "Once you're in, open the <strong>Connection</strong> tab for a ten-minute, no-coding walkthrough of connecting a real database so your site works from any device.";
  }
}

function wireLogin() {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("loginError");
    const btn = document.getElementById("loginBtn");
    const email = document.getElementById("loginEmail").value;
    const pw = document.getElementById("loginPw").value;

    err.textContent = "";
    btn.disabled = true;
    btn.textContent = "Signing in…";
    try {
      const ok = await Store.signIn(email, pw);
      if (!ok) throw new Error("That password doesn't match. Please try again.");
      /* Signed in — reload content as the draft this time. */
      await Store.boot({ admin: true });
      loadState();
      showDashboard();
    } catch (e2) {
      err.textContent = e2.message || "We couldn't sign you in.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Sign In";
    }
  });
}

/* ---------------------------------------------------------------- SHELL */
function showDashboard() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");

  const who = Store.mode === "cloud" ? Cloud.currentEmail() : "This browser";
  document.getElementById("sideUser").textContent = who;

  initTabs();
  initSaveBar();
  initArtworksPanel();
  initMediaPanel();
  initCollectionsPanel();
  initHomepagePanel();
  initBioPanel();
  initCvPanel();
  initCvFileUploader();
  initContactPanel();
  initConnectionPanel();
  initSettingsPanel();
  initArtworkModal();

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await Store.signOut();
    location.reload();
  });
}

function initTabs() {
  document.querySelectorAll(".admin-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

/* ------------------------------------------------------------- SAVE BAR */
/* The one piece of UI that's always on screen. It answers two questions
   the artist will otherwise have to guess at: is my work saved, and is it
   live? */
function initSaveBar() {
  const bar = document.getElementById("saveBar");
  const text = document.getElementById("saveStateText");
  const chip = document.getElementById("liveChip");

  Store.onSaveStateChange((status, detail) => {
    bar.classList.remove("is-saving", "is-error");
    if (status === "saving") {
      bar.classList.add("is-saving");
      text.textContent = "Saving…";
    } else if (status === "saved") {
      text.textContent = "Draft saved · " + new Date(detail).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      chip.hidden = !Store.hasUnpublishedChanges();
    } else if (status === "published") {
      text.textContent = "Published — your website is up to date";
      chip.hidden = true;
    } else if (status === "error") {
      bar.classList.add("is-error");
      text.textContent = detail || "Couldn't save — check your connection.";
    } else if (status === "dirty") {
      text.textContent = "Unsaved changes…";
    }
  });

  chip.hidden = !Store.hasUnpublishedChanges();

  document.getElementById("publishBtn").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = "Publishing…";
    try {
      await Store.publish();
      toast("Published. Your changes are now live for every visitor.");
    } catch (err) {
      toast("Publish failed: " + (err.message || "unknown error"), true);
    } finally {
      btn.disabled = false;
      btn.textContent = "Publish to Website";
    }
  });

  /* Don't let anyone close the tab mid-save. */
  window.addEventListener("beforeunload", (e) => {
    if (Store.isDirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

function toast(msg, isError) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.toggle("error", Boolean(isError));
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 4200);
}

/* ---------------------------------------------------------------- ARTWORKS */
function initArtworksPanel() {
  renderArtworkList();
  document.getElementById("addArtworkBtn").addEventListener("click", () => openArtworkModal(null));
}

function renderArtworkList() {
  const mount = document.getElementById("artworkListMount");
  if (!state.artworks.length) {
    mount.innerHTML = `<p class="field-note">No artworks yet. Press “+ Add Artwork” to create your first entry — you can drag the photograph straight in.</p>`;
    return;
  }
  mount.innerHTML = state.artworks
    .map(
      (a, i) => `
    <div class="admin-list-row ${a.published === false ? "is-hidden-row" : ""}" data-id="${escapeAttr(a.id)}">
      <img class="admin-thumb" src="${escapeAttr(a.image)}" alt="" loading="lazy" />
      <div class="admin-list-info">
        <h4>${escapeHTML(a.title)} ${a.featured ? '<span class="star" title="Featured on the homepage">★</span>' : ""}</h4>
        <div class="label-line"><span>${a.year}</span><span>${escapeHTML(a.category)}</span><span>${escapeHTML(a.medium)}</span></div>
      </div>
      <span class="pill ${a.status === "sold" ? "sold" : a.status === "available" ? "available" : ""}">${statusLabel(a.status)}</span>
      ${a.published === false ? '<span class="pill hidden-pill">Hidden</span>' : ""}
      <div class="admin-row-actions">
        <button class="icon-btn" data-act="up" ${i === 0 ? "disabled" : ""} title="Move up">↑</button>
        <button class="icon-btn" data-act="down" ${i === state.artworks.length - 1 ? "disabled" : ""} title="Move down">↓</button>
        <button class="icon-btn" data-act="vis">${a.published === false ? "Show" : "Hide"}</button>
        <button class="icon-btn gold" data-act="edit">Edit</button>
        <button class="icon-btn" data-act="delete">Delete</button>
      </div>
    </div>`
    )
    .join("");

  mount.querySelectorAll(".admin-list-row").forEach((row) => {
    const id = row.dataset.id;
    row.querySelector('[data-act="edit"]').addEventListener("click", () => openArtworkModal(id));
    row.querySelector('[data-act="delete"]').addEventListener("click", () => deleteArtwork(id));
    row.querySelector('[data-act="vis"]').addEventListener("click", () => toggleVisibility(id));
    row.querySelector('[data-act="up"]')?.addEventListener("click", () => moveArtwork(id, -1));
    row.querySelector('[data-act="down"]')?.addEventListener("click", () => moveArtwork(id, 1));
  });
}

function moveArtwork(id, dir) {
  const i = state.artworks.findIndex((a) => a.id === id);
  const j = i + dir;
  if (j < 0 || j >= state.artworks.length) return;
  [state.artworks[i], state.artworks[j]] = [state.artworks[j], state.artworks[i]];
  commitArtworks();
  renderArtworkList();
}

function toggleVisibility(id) {
  const art = state.artworks.find((a) => a.id === id);
  art.published = art.published === false;
  commitArtworks();
  renderArtworkList();
  toast(art.published ? `“${art.title}” is visible on the site.` : `“${art.title}” is hidden from visitors.`);
}

function deleteArtwork(id) {
  const art = state.artworks.find((a) => a.id === id);
  if (!confirm(`Delete “${art.title}” permanently?\n\nIf you only want it off the website for now, press Hide instead — that keeps it in your archive.`)) return;
  state.artworks = state.artworks.filter((a) => a.id !== id);
  commitArtworks();
  renderArtworkList();
  renderFeaturedPicker();
}

/* ----- artwork editor modal ----- */
function initArtworkModal() {
  refreshCategorySelect();
  document.getElementById("closeModalBtn").addEventListener("click", closeArtworkModal);
  document.getElementById("cancelArtworkBtn").addEventListener("click", closeArtworkModal);
  document.getElementById("saveArtworkBtn").addEventListener("click", saveArtworkFromModal);
  document.getElementById("artworkModal").addEventListener("click", (e) => {
    if (e.target.id === "artworkModal") closeArtworkModal();
  });
}

function refreshCategorySelect() {
  const catSelect = document.getElementById("fldCategory");
  if (!catSelect) return;
  catSelect.innerHTML = state.categories
    .map((c) => `<option value="${escapeAttr(c)}">${escapeHTML(c)}</option>`)
    .join("");
}

function openArtworkModal(id) {
  state.editingId = id;
  const modal = document.getElementById("artworkModal");
  const art = id ? state.artworks.find((a) => a.id === id) : null;

  refreshCategorySelect();
  document.getElementById("modalTitle").textContent = art ? "Edit Artwork" : "Add Artwork";
  document.getElementById("fldTitle").value = art?.title || "";
  document.getElementById("fldYear").value = art?.year || new Date().getFullYear();
  document.getElementById("fldCategory").value = art?.category || state.categories[0];
  document.getElementById("fldMedium").value = art?.medium || "";
  document.getElementById("fldDimensions").value = art?.dimensions || "";
  document.getElementById("fldStatus").value = art?.status || "available";
  document.getElementById("fldPublished").value = art?.published === false ? "no" : "yes";
  document.getElementById("fldFeatured").checked = !!art?.featured;
  document.getElementById("fldDescription").value = art?.description || "";
  document.getElementById("fldInspiration").value = art?.inspiration || "";
  document.getElementById("fldInterpretation").value = art?.interpretation || "";

  /* Main image and any extra views are one ordered list in the editor —
     far easier to think about than a "main image" field plus a separate
     "additional images" field. Position one is the main image. */
  const images = art ? [art.image, ...(art.images || [])].filter(Boolean) : [];
  uploaders.artwork = Uploader.gallery(document.getElementById("artworkImagesMount"), {
    value: images,
    folder: "artworks",
    label: "Drag photographs of this piece here",
    hint: "or click to browse · JPG, PNG or WEBP · straight from your camera is fine",
  });

  modal.classList.add("open");
  document.getElementById("fldTitle").focus();
}

function closeArtworkModal() {
  document.getElementById("artworkModal").classList.remove("open");
  state.editingId = null;
}

function saveArtworkFromModal() {
  const title = document.getElementById("fldTitle").value.trim();
  if (!title) {
    alert("Please give the artwork a title.");
    return;
  }
  const images = uploaders.artwork ? uploaders.artwork.value : [];
  if (!images.length) {
    if (!confirm("This piece has no photograph yet. Save it anyway and add the image later?")) return;
  }

  const payload = {
    title,
    year: Number(document.getElementById("fldYear").value) || new Date().getFullYear(),
    category: document.getElementById("fldCategory").value,
    medium: document.getElementById("fldMedium").value.trim(),
    dimensions: document.getElementById("fldDimensions").value.trim(),
    status: document.getElementById("fldStatus").value,
    published: document.getElementById("fldPublished").value === "yes",
    featured: document.getElementById("fldFeatured").checked,
    image: images[0] || "assets/images/artworks/hero-artwork.svg",
    images: images.slice(1),
    description: document.getElementById("fldDescription").value.trim(),
    inspiration: document.getElementById("fldInspiration").value.trim(),
    interpretation: document.getElementById("fldInterpretation").value.trim(),
  };

  if (state.editingId) {
    const idx = state.artworks.findIndex((a) => a.id === state.editingId);
    state.artworks[idx] = { ...state.artworks[idx], ...payload };
  } else {
    let slug = Store.slugify(title);
    let n = 2;
    while (state.artworks.some((a) => a.id === slug)) slug = Store.slugify(title) + "-" + n++;
    state.artworks.unshift({ id: slug, ...payload });
  }

  if (state.artworks.filter((a) => a.featured).length > 4) {
    alert("Only four artworks can sit on the homepage at once. Open the Homepage tab to choose which four.");
  }

  commitArtworks();
  renderArtworkList();
  renderFeaturedPicker();
  closeArtworkModal();
  toast(`“${title}” saved. Press Publish when you're ready for visitors to see it.`);
}

/* ---------------------------------------------------------------- MEDIA */
function initMediaPanel() {
  /* This drop zone feeds the library rather than a specific artwork, so the
     tiles are cleared as soon as each upload lands — the file's home is the
     grid below, and showing it twice would only muddle things. */
  uploaders.media = Uploader.gallery(document.getElementById("mediaUploadMount"), {
    value: [],
    folder: "artworks",
    label: "Drag photographs here to add them to your library",
    hint: "or click to browse · you can drop many at once",
    onChange: () => {
      uploaders.media.set([]);
      renderMediaGrid();
    },
  });
  document.getElementById("refreshMediaBtn").addEventListener("click", renderMediaGrid);
  renderMediaGrid();
}

async function renderMediaGrid() {
  const grid = document.getElementById("mediaGridMount");
  grid.innerHTML = `<p class="lib-empty">Loading your files…</p>`;
  const files = await Media.library();
  if (!files.length) {
    grid.innerHTML = `<p class="lib-empty">Nothing uploaded yet. Everything you add above appears here, ready to reuse anywhere on the site.</p>`;
    return;
  }
  grid.innerHTML = files
    .map(
      (f) => `
      <figure class="lib-tile" data-path="${escapeAttr(f.path)}">
        <img src="${escapeAttr(f.url)}" alt="" loading="lazy" />
        <figcaption>${escapeHTML(f.name || f.path)}<span>${Media.humanSize(f.size)}</span></figcaption>
        <button type="button" class="lib-del" title="Delete permanently">✕</button>
      </figure>`
    )
    .join("");

  grid.querySelectorAll(".lib-tile").forEach((tile) => {
    tile.querySelector(".lib-del").addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Delete this file permanently? Any artwork still using it will lose its image.")) return;
      await Media.remove(tile.dataset.path);
      tile.remove();
    });
  });
}

/* ---------------------------------------------------------------- HOMEPAGE */
function initHomepagePanel() {
  uploaders.hero = Uploader.single(document.getElementById("heroUploadMount"), {
    value: state.site.heroImage || "",
    folder: "artworks",
    label: "Drag the opening image here",
    hint: "or click to browse · a wide, high-resolution photograph works best",
    onChange: (url) => {
      state.site.heroImage = url;
      commitSite();
    },
  });

  document.getElementById("heroTaglineInput").value = state.site.tagline || "";
  document.getElementById("heroCreditInput").value = state.site.heroImageCredit || "";
  renderFeaturedPicker();

  document.getElementById("saveHomepageBtn").addEventListener("click", () => {
    state.site.tagline = document.getElementById("heroTaglineInput").value.trim();
    state.site.heroImageCredit = document.getElementById("heroCreditInput").value.trim();
    state.site.heroImage = uploaders.hero.value || state.site.heroImage;
    commitSite();
    commitArtworks();
    toast("Homepage saved.");
  });
}

function renderFeaturedPicker() {
  const mount = document.getElementById("featuredPickerMount");
  if (!mount) return;
  mount.innerHTML = state.artworks
    .map(
      (a) => `
    <label class="feature-row">
      <input type="checkbox" data-id="${escapeAttr(a.id)}" ${a.featured ? "checked" : ""} />
      <img src="${escapeAttr(a.image)}" alt="" loading="lazy" />
      <span>${escapeHTML(a.title)}</span>
    </label>`
    )
    .join("");

  mount.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const featuredNow = state.artworks.filter((a) => a.featured).length;
      if (cb.checked && featuredNow >= 4) {
        cb.checked = false;
        alert("You can feature at most four artworks on the homepage. Uncheck one first.");
        return;
      }
      state.artworks.find((a) => a.id === cb.dataset.id).featured = cb.checked;
      commitArtworks();
    });
  });
}

/* ---------------------------------------------------------------- BIOGRAPHY */
function initBioPanel() {
  uploaders.portrait = Uploader.single(document.getElementById("portraitUploadMount"), {
    value: state.site.portraitImage || "",
    folder: "portrait",
    label: "Drag your portrait here",
    hint: "or click to browse · this appears on the About page and your homepage introduction",
    onChange: (url) => {
      state.site.portraitImage = url;
      commitSite();
    },
  });

  document.getElementById("bioIntro").value = state.site.bio.intro || "";
  document.getElementById("bioP1").value = state.site.bio.paragraphs[0] || "";
  document.getElementById("bioP2").value = state.site.bio.paragraphs[1] || "";
  document.getElementById("bioP3").value = state.site.bio.paragraphs[2] || "";
  document.getElementById("bioPhilosophy").value = state.site.philosophy || "";
  document.getElementById("bioStatement").value = state.site.statement || "";

  document.getElementById("saveBioBtn").addEventListener("click", () => {
    state.site.bio.intro = document.getElementById("bioIntro").value.trim();
    state.site.bio.paragraphs = [
      document.getElementById("bioP1").value.trim(),
      document.getElementById("bioP2").value.trim(),
      document.getElementById("bioP3").value.trim(),
    ].filter(Boolean);
    state.site.philosophy = document.getElementById("bioPhilosophy").value.trim();
    state.site.statement = document.getElementById("bioStatement").value.trim();
    state.site.portraitImage = uploaders.portrait.value || state.site.portraitImage;
    commitSite();
    toast("Biography saved.");
  });
}

/* ---------------------------------------------------------------- CV FILE */
function initCvFileUploader() {
  uploaders.cv = Uploader.file(document.getElementById("cvFileMount"), {
    value: state.site.cvFile || "",
    onChange: (url) => {
      state.site.cvFile = url;
      commitSite();
      toast(url ? "CV uploaded — the Download CV button now serves your file." : "CV removed — the site will generate a PDF from the page instead.");
    },
  });
}

/* ---------------------------------------------------------------- CONNECTION */
const SETUP_SQL = `-- Studio Admin — run this once in Supabase → SQL Editor → New query → Run.

-- 1. The table that holds your website's content (one row for your
--    private draft, one row for what the public sees).
create table if not exists public.site_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_state enable row level security;

-- 2. Anyone may read the published version. Nobody may read your draft
--    unless they are signed in as you.
drop policy if exists "published is public" on public.site_state;
create policy "published is public" on public.site_state
  for select using (id = 'published');

drop policy if exists "signed in can read all" on public.site_state;
create policy "signed in can read all" on public.site_state
  for select to authenticated using (true);

-- 3. Only a signed-in admin may write anything.
drop policy if exists "signed in can write" on public.site_state;
create policy "signed in can write" on public.site_state
  for all to authenticated using (true) with check (true);

-- 4. The bucket your photographs live in: public to look at,
--    private to add to.
insert into storage.buckets (id, name, public)
values ('gallery-media', 'gallery-media', true)
on conflict (id) do update set public = true;

drop policy if exists "media is public" on storage.objects;
create policy "media is public" on storage.objects
  for select using (bucket_id = 'gallery-media');

drop policy if exists "signed in can upload media" on storage.objects;
create policy "signed in can upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'gallery-media');

drop policy if exists "signed in can change media" on storage.objects;
create policy "signed in can change media" on storage.objects
  for update to authenticated using (bucket_id = 'gallery-media');

drop policy if exists "signed in can delete media" on storage.objects;
create policy "signed in can delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'gallery-media');
`;

function initConnectionPanel() {
  document.getElementById("sqlBox").textContent = SETUP_SQL;

  document.getElementById("copySqlBtn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(SETUP_SQL);
      toast("Setup script copied. Paste it into Supabase → SQL Editor and press Run.");
    } catch (e) {
      toast("Couldn't copy automatically — select the script below and copy it manually.", true);
    }
  });

  document.getElementById("downloadSqlBtn").addEventListener("click", () => {
    const blob = new Blob([SETUP_SQL], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "supabase-setup.sql";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById("recheckBtn").addEventListener("click", runDiagnostics);
  runDiagnostics();
}

async function runDiagnostics() {
  const statusEl = document.getElementById("connStatus");
  const listEl = document.getElementById("connChecks");
  statusEl.className = "conn-status";
  statusEl.innerHTML = `<span class="status-dot"></span><span>Checking…</span>`;
  listEl.innerHTML = "";

  const d = await Cloud.diagnose();
  const rows = [
    ["Database details entered in config.js", d.configured],
    ["Project reachable from this browser", d.reachable],
    ["Content table set up", d.tableOk],
    [`Photo storage bucket “${APP_CONFIG.BUCKET}” ready`, d.bucketOk],
    ["You are signed in as an admin", d.signedIn],
  ];

  const allGood = d.configured && d.reachable && d.tableOk && d.bucketOk;
  if (allGood) statusEl.classList.add("ok");
  else if (d.configured) statusEl.classList.add("warn");
  statusEl.innerHTML = `<span class="status-dot"></span><span>${escapeHTML(
    allGood
      ? "Connected. Your website saves to the cloud and works from any device."
      : d.message
  )}</span>`;

  listEl.innerHTML = rows
    .map(
      ([label, ok]) =>
        `<li class="${ok ? "yes" : "no"}"><span>${ok ? "✓" : "○"}</span>${escapeHTML(label)}</li>`
    )
    .join("");

  /* Once everything's green the walkthrough is just noise — fade it back
     rather than removing it, so it's still there if something breaks later. */
  document.getElementById("setupGuideCard").style.opacity = allGood ? "0.6" : "1";
}

/* ---------------------------------------------------------------- SETTINGS */
function initSettingsPanel() {
  document.getElementById("localPwCard").hidden = Store.mode === "cloud";

  document.getElementById("backupBtn").addEventListener("click", () => {
    Store.downloadBackup();
    toast("Backup downloaded. Keep it somewhere safe.");
  });

  document.getElementById("exportBtn").addEventListener("click", () => Store.downloadExport());

  document.getElementById("restoreBtn").addEventListener("click", () =>
    document.getElementById("restoreInput").click()
  );
  document.getElementById("restoreInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm("Restoring replaces everything currently in your draft with the contents of this backup. Continue?")) return;
    try {
      await Store.restoreBackup(file);
      loadState();
      toast("Backup restored into your draft. Review it, then press Publish.");
      setTimeout(() => location.reload(), 1200);
    } catch (err) {
      document.getElementById("backupMsg").textContent = err.message;
    }
  });

  document.getElementById("discardDraftBtn").addEventListener("click", async () => {
    if (!confirm("Throw away every unpublished change and go back to what's currently live on the website?")) return;
    await Store.discardDraft();
    location.reload();
  });

  document.getElementById("changePwBtn").addEventListener("click", async () => {
    const a = document.getElementById("newPw").value;
    const b = document.getElementById("confirmPw").value;
    const msg = document.getElementById("pwChangeMsg");
    if (a.length < 6) { msg.textContent = "Password should be at least 6 characters."; return; }
    if (a !== b) { msg.textContent = "Those two passwords don't match."; return; }
    await Store.setPassword(a);
    msg.style.color = "#5c8a5c";
    msg.textContent = "Password updated for this browser.";
    document.getElementById("newPw").value = "";
    document.getElementById("confirmPw").value = "";
  });
}

/* ---------------------------------------------------------------- COLLECTIONS */
function initCollectionsPanel() {
  renderCategoryList();
  document.getElementById("addCategoryBtn").addEventListener("click", () => {
    const input = document.getElementById("newCategoryInput");
    const val = input.value.trim();
    if (!val) return;
    if (state.categories.includes(val)) { alert("That collection already exists."); return; }
    state.categories.push(val);
    Store.saveCategories(state.categories);
    input.value = "";
    renderCategoryList();
    refreshCategorySelect();
  });
}

function renderCategoryList() {
  const mount = document.getElementById("categoryListMount");
  mount.innerHTML = state.categories.map(c => {
    const count = state.artworks.filter(a => a.category === c).length;
    return `
      <div class="admin-list-row">
        <div class="admin-list-info"><h4>${escapeHTML(c)}</h4><div class="label-line"><span>${count} artwork${count === 1 ? "" : "s"}</span></div></div>
        <button class="icon-btn" data-cat="${escapeAttr(c)}">Remove</button>
      </div>`;
  }).join("");
  mount.querySelectorAll("[data-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.cat;
      const inUse = state.artworks.some(a => a.category === cat);
      if (inUse && !confirm(`"${cat}" is used by existing artworks. Remove it from the collections list anyway? (Those artworks will keep the category name, just without a filter tab.)`)) return;
      state.categories = state.categories.filter(c => c !== cat);
      Store.saveCategories(state.categories);
      renderCategoryList();
      refreshCategorySelect();
    });
  });
}

/* ---------------------------------------------------------------- CV */
function initCvPanel() {
  document.getElementById("cvTitleInput").value = state.site.cv.title || "";
  document.getElementById("cvProfileInput").value = state.site.cv.profile || "";

  const mount = document.getElementById("cvRepeatables");
  mount.innerHTML = `
    ${timelineSectionHTML("education", "Education")}
    ${timelineSectionHTML("experience", "Professional Experience")}
    ${timelineSectionHTML("exhibitions", "Exhibitions")}
    ${timelineSectionHTML("workshops", "Workshops")}
    ${achievementSectionHTML()}
    ${tagSectionHTML("skills", "Skills")}
    ${tagSectionHTML("mediums", "Artistic Mediums")}
    <div class="btn-row"><button class="btn btn-solid" id="saveCvBtn">Save CV</button></div>
  `;

  wireTimelineSection("education");
  wireTimelineSection("experience");
  wireTimelineSection("exhibitions");
  wireTimelineSection("workshops");
  wireAchievementSection();
  wireTagSection("skills");
  wireTagSection("mediums");

  document.getElementById("saveCvBtn").addEventListener("click", () => {
    state.site.cv.title = document.getElementById("cvTitleInput").value.trim();
    state.site.cv.profile = document.getElementById("cvProfileInput").value.trim();
    Store.saveSite(state.site);
    alert("CV saved.");
  });
}

function timelineSectionHTML(key, label) {
  return `
    <div class="admin-card">
      <p class="eyebrow" style="margin-bottom:14px;">${label}</p>
      <div id="tl-${key}"></div>
      <div class="btn-row"><button class="icon-btn gold" data-add="${key}">+ Add ${label} Entry</button></div>
    </div>`;
}
function achievementSectionHTML() {
  return `
    <div class="admin-card">
      <p class="eyebrow" style="margin-bottom:14px;">Achievements</p>
      <div id="tl-achievements"></div>
      <div class="btn-row"><button class="icon-btn gold" data-add="achievements">+ Add Achievement</button></div>
    </div>`;
}
function tagSectionHTML(key, label) {
  return `
    <div class="admin-card">
      <p class="eyebrow" style="margin-bottom:14px;">${label}</p>
      <div id="tag-${key}" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:16px;"></div>
      <div class="btn-row">
        <input type="text" id="tagInput-${key}" placeholder="Add ${label.toLowerCase()}…" style="border:1px solid var(--line-dark); padding:10px 12px; flex:1; min-width:200px;" />
        <button class="icon-btn gold" data-tagadd="${key}">+ Add</button>
      </div>
    </div>`;
}

function wireTimelineSection(key) {
  renderTimeline(key);
  document.querySelector(`[data-add="${key}"]`).addEventListener("click", () => {
    state.site[key].unshift({ year: String(new Date().getFullYear()), title: "New Entry", place: "", detail: "" });
    Store.saveSite(state.site);
    renderTimeline(key);
  });
}

function renderTimeline(key) {
  const mount = document.getElementById("tl-" + key);
  mount.innerHTML = state.site[key].map((item, i) => `
    <div class="admin-form-grid" style="border-bottom:1px solid var(--line-dark); padding:16px 0;">
      <div class="admin-field"><label>Year</label><input data-k="${key}" data-i="${i}" data-f="year" value="${escapeAttr(item.year)}" /></div>
      <div class="admin-field"><label>Title</label><input data-k="${key}" data-i="${i}" data-f="title" value="${escapeAttr(item.title)}" /></div>
      <div class="admin-field"><label>Place / Institution</label><input data-k="${key}" data-i="${i}" data-f="place" value="${escapeAttr(item.place || "")}" /></div>
      <div class="admin-field full"><label>Detail</label><textarea data-k="${key}" data-i="${i}" data-f="detail">${escapeHTML(item.detail || "")}</textarea></div>
      <div class="admin-field full"><button class="icon-btn" data-remove="${key}" data-i="${i}">Remove Entry</button></div>
    </div>
  `).join("") || `<p style="color:var(--stone); font-size:13px;">No entries yet.</p>`;

  mount.querySelectorAll("input[data-k], textarea[data-k]").forEach(el => {
    el.addEventListener("input", () => {
      const { k, i, f } = el.dataset;
      state.site[k][i][f] = el.value;
      Store.saveSite(state.site);
    });
  });
  mount.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.site[btn.dataset.remove].splice(Number(btn.dataset.i), 1);
      Store.saveSite(state.site);
      renderTimeline(btn.dataset.remove);
    });
  });
}

function wireAchievementSection() {
  renderAchievements();
  document.querySelector('[data-add="achievements"]').addEventListener("click", () => {
    state.site.achievements.unshift({ year: String(new Date().getFullYear()), detail: "New achievement" });
    Store.saveSite(state.site);
    renderAchievements();
  });
}
function renderAchievements() {
  const mount = document.getElementById("tl-achievements");
  mount.innerHTML = state.site.achievements.map((item, i) => `
    <div class="admin-form-grid" style="border-bottom:1px solid var(--line-dark); padding:16px 0;">
      <div class="admin-field"><label>Year</label><input data-ai="${i}" data-af="year" value="${escapeAttr(item.year)}" /></div>
      <div class="admin-field"><label>Detail</label><input data-ai="${i}" data-af="detail" value="${escapeAttr(item.detail)}" /></div>
      <div class="admin-field full"><button class="icon-btn" data-aremove="${i}">Remove</button></div>
    </div>
  `).join("") || `<p style="color:var(--stone); font-size:13px;">No entries yet.</p>`;

  mount.querySelectorAll("[data-ai]").forEach(el => {
    el.addEventListener("input", () => {
      state.site.achievements[el.dataset.ai][el.dataset.af] = el.value;
      Store.saveSite(state.site);
    });
  });
  mount.querySelectorAll("[data-aremove]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.site.achievements.splice(Number(btn.dataset.aremove), 1);
      Store.saveSite(state.site);
      renderAchievements();
    });
  });
}

function wireTagSection(key) {
  renderTags(key);
  document.querySelector(`[data-tagadd="${key}"]`).addEventListener("click", () => {
    const input = document.getElementById("tagInput-" + key);
    const val = input.value.trim();
    if (!val) return;
    state.site[key].push(val);
    Store.saveSite(state.site);
    input.value = "";
    renderTags(key);
  });
}
function renderTags(key) {
  const mount = document.getElementById("tag-" + key);
  mount.innerHTML = state.site[key].map((t, i) => `
    <span class="pill" style="display:flex; align-items:center; gap:8px;">${escapeHTML(t)}
      <button data-tagremove="${key}" data-i="${i}" style="border:none;background:none;cursor:pointer;color:var(--clay);font-family:var(--mono);">✕</button>
    </span>`).join("");
  mount.querySelectorAll("[data-tagremove]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.site[btn.dataset.tagremove].splice(Number(btn.dataset.i), 1);
      Store.saveSite(state.site);
      renderTags(btn.dataset.tagremove);
    });
  });
}

/* ---------------------------------------------------------------- CONTACT */
function initContactPanel() {
  document.getElementById("contactArtistName").value = state.site.artistName || "";
  document.getElementById("contactEmail").value = state.site.contact.email || "";
  document.getElementById("contactPhone").value = state.site.contact.phone || "";
  document.getElementById("contactLocation").value = state.site.contact.location || "";
  document.getElementById("contactInstagram").value = state.site.contact.instagram || "";
  document.getElementById("contactLinkedin").value = state.site.contact.linkedin || "";
  document.getElementById("contactFacebook").value = state.site.contact.facebook || "";
  document.getElementById("contactPinterest").value = state.site.contact.pinterest || "";
  document.getElementById("contactWhatsapp").value = state.site.contact.whatsapp || "";
  document.getElementById("contactFormEndpoint").value = state.site.contact.formEndpoint || "";

  document.getElementById("saveContactBtn").addEventListener("click", () => {
    state.site.artistName = document.getElementById("contactArtistName").value.trim() || state.site.artistName;
    state.site.contact = {
      email: document.getElementById("contactEmail").value.trim(),
      phone: document.getElementById("contactPhone").value.trim(),
      location: document.getElementById("contactLocation").value.trim(),
      instagram: document.getElementById("contactInstagram").value.trim(),
      linkedin: document.getElementById("contactLinkedin").value.trim(),
      facebook: document.getElementById("contactFacebook").value.trim(),
      pinterest: document.getElementById("contactPinterest").value.trim(),
      whatsapp: document.getElementById("contactWhatsapp").value.trim(),
      formEndpoint: document.getElementById("contactFormEndpoint").value.trim(),
    };
    Store.saveSite(state.site);
    toast("Contact details saved.");
  });
}

/* ---------------------------------------------------------------- SETTINGS */

/* ---------------------------------------------------------------- helpers */
function escapeHTML(str) {
  return String(str ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
function escapeAttr(str) { return escapeHTML(str); }
function statusLabel(status) {
  return { available: "Available", sold: "Sold", "not-for-sale": "Not For Sale" }[status] || status;
}
