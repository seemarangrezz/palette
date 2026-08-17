/* ==========================================================================
   ADMIN — the whole Studio Admin dashboard. No framework, just DOM.
   Everything reads/writes through Store (data.js + localStorage draft).
   ========================================================================== */

const state = {
  site: null,
  artworks: null,
  categories: null,
  editingId: null, // artwork currently open in the modal ("" for new)
};

document.addEventListener("DOMContentLoaded", async () => {
  Store.ensureDraft();
  loadState();
  wireLogin();

  if (Store.isLoggedIn()) showDashboard();
});

function loadState() {
  state.site = JSON.parse(JSON.stringify(Store.getSite()));
  state.artworks = JSON.parse(JSON.stringify(Store.getArtworks()));
  state.categories = JSON.parse(JSON.stringify(Store.getCategories()));
}

/* ---------------------------------------------------------------- LOGIN */
function wireLogin() {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pw = document.getElementById("loginPw").value;
    const ok = await Store.checkPassword(pw);
    const err = document.getElementById("loginError");
    if (ok) {
      Store.login();
      showDashboard();
    } else {
      err.textContent = "Incorrect password. Please try again.";
    }
  });
}

function showDashboard() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  initTabs();
  initArtworksPanel();
  initCollectionsPanel();
  initHomepagePanel();
  initBioPanel();
  initCvPanel();
  initContactPanel();
  initSettingsPanel();
  initArtworkModal();
  updateStatusBanner();

  document.getElementById("logoutBtn").addEventListener("click", () => {
    Store.logout();
    location.reload();
  });
}

function updateStatusBanner() {
  const banner = document.getElementById("statusBanner");
  const text = document.getElementById("statusText");
  banner.classList.add("saved");
  text.textContent = "Draft saved in this browser — export data.js when you're ready to publish.";
  document.getElementById("exportTopBtn").addEventListener("click", () => Store.downloadExport());
}

/* ---------------------------------------------------------------- TABS */
function initTabs() {
  document.querySelectorAll(".admin-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
    });
  });
}

/* ---------------------------------------------------------------- ARTWORKS */
function initArtworksPanel() {
  renderArtworkList();
  document.getElementById("addArtworkBtn").addEventListener("click", () => openArtworkModal(null));
}

function renderArtworkList() {
  const mount = document.getElementById("artworkListMount");
  if (!state.artworks.length) {
    mount.innerHTML = `<p style="color:var(--stone); font-size:14px;">No artworks yet. Click "+ Add Artwork" to create your first entry.</p>`;
    return;
  }
  mount.innerHTML = state.artworks.map((a, i) => `
    <div class="admin-list-row" data-id="${escapeAttr(a.id)}">
      <img class="admin-thumb" src="${escapeAttr(a.image)}" alt="" />
      <div class="admin-list-info">
        <h4>${escapeHTML(a.title)} ${a.featured ? "★" : ""}</h4>
        <div class="label-line"><span>${a.year}</span><span>${escapeHTML(a.category)}</span><span>${escapeHTML(a.medium)}</span></div>
      </div>
      <span class="pill ${a.status === "sold" ? "sold" : a.status === "available" ? "available" : ""}">${statusLabel(a.status)}</span>
      <div class="admin-row-actions">
        <button class="icon-btn" data-act="up" ${i === 0 ? "disabled" : ""}>↑</button>
        <button class="icon-btn" data-act="down" ${i === state.artworks.length - 1 ? "disabled" : ""}>↓</button>
        <button class="icon-btn gold" data-act="edit">Edit</button>
        <button class="icon-btn" data-act="delete">Delete</button>
      </div>
    </div>
  `).join("");

  mount.querySelectorAll(".admin-list-row").forEach(row => {
    const id = row.dataset.id;
    row.querySelector('[data-act="edit"]').addEventListener("click", () => openArtworkModal(id));
    row.querySelector('[data-act="delete"]').addEventListener("click", () => deleteArtwork(id));
    row.querySelector('[data-act="up"]')?.addEventListener("click", () => moveArtwork(id, -1));
    row.querySelector('[data-act="down"]')?.addEventListener("click", () => moveArtwork(id, 1));
  });
}

function moveArtwork(id, dir) {
  const i = state.artworks.findIndex(a => a.id === id);
  const j = i + dir;
  if (j < 0 || j >= state.artworks.length) return;
  [state.artworks[i], state.artworks[j]] = [state.artworks[j], state.artworks[i]];
  Store.saveArtworks(state.artworks);
  renderArtworkList();
}

function deleteArtwork(id) {
  const art = state.artworks.find(a => a.id === id);
  if (!confirm(`Delete "${art.title}"? This can't be undone in this browser (export a backup first if unsure).`)) return;
  state.artworks = state.artworks.filter(a => a.id !== id);
  Store.saveArtworks(state.artworks);
  renderArtworkList();
  renderFeaturedPicker();
}

/* ----- artwork editor modal ----- */
function initArtworkModal() {
  const catSelect = document.getElementById("fldCategory");
  catSelect.innerHTML = state.categories.map(c => `<option value="${escapeAttr(c)}">${escapeHTML(c)}</option>`).join("");

  document.getElementById("closeModalBtn").addEventListener("click", closeArtworkModal);
  document.getElementById("cancelArtworkBtn").addEventListener("click", closeArtworkModal);
  document.getElementById("saveArtworkBtn").addEventListener("click", saveArtworkFromModal);

  document.getElementById("fldImage").addEventListener("input", (e) => {
    document.getElementById("fldImagePreview").src = e.target.value;
  });
  document.getElementById("fldImageUpload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById("fldImagePreview").src = reader.result;
      // Store the preview data URL temporarily so it's visible in-browser;
      // the path field is what actually gets exported/published.
      document.getElementById("fldImagePreview").dataset.tempSrc = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function openArtworkModal(id) {
  state.editingId = id;
  const modal = document.getElementById("artworkModal");
  const art = id ? state.artworks.find(a => a.id === id) : null;

  document.getElementById("modalTitle").textContent = art ? "Edit Artwork" : "Add Artwork";
  document.getElementById("fldTitle").value = art?.title || "";
  document.getElementById("fldYear").value = art?.year || new Date().getFullYear();
  document.getElementById("fldCategory").value = art?.category || state.categories[0];
  document.getElementById("fldMedium").value = art?.medium || "";
  document.getElementById("fldDimensions").value = art?.dimensions || "";
  document.getElementById("fldStatus").value = art?.status || "available";
  document.getElementById("fldFeatured").checked = !!art?.featured;
  document.getElementById("fldImage").value = art?.image || "";
  document.getElementById("fldImagePreview").src = art?.image || "assets/images/artworks/hero-artwork.svg";
  document.getElementById("fldDescription").value = art?.description || "";
  document.getElementById("fldInspiration").value = art?.inspiration || "";
  document.getElementById("fldInterpretation").value = art?.interpretation || "";

  modal.classList.add("open");
}

function closeArtworkModal() {
  document.getElementById("artworkModal").classList.remove("open");
  state.editingId = null;
}

function saveArtworkFromModal() {
  const title = document.getElementById("fldTitle").value.trim();
  if (!title) { alert("Please give the artwork a title."); return; }

  const payload = {
    title,
    year: Number(document.getElementById("fldYear").value) || new Date().getFullYear(),
    category: document.getElementById("fldCategory").value,
    medium: document.getElementById("fldMedium").value.trim(),
    dimensions: document.getElementById("fldDimensions").value.trim(),
    status: document.getElementById("fldStatus").value,
    featured: document.getElementById("fldFeatured").checked,
    image: document.getElementById("fldImage").value.trim() || "assets/images/artworks/hero-artwork.svg",
    images: [],
    description: document.getElementById("fldDescription").value.trim(),
    inspiration: document.getElementById("fldInspiration").value.trim(),
    interpretation: document.getElementById("fldInterpretation").value.trim(),
  };

  if (state.editingId) {
    const idx = state.artworks.findIndex(a => a.id === state.editingId);
    state.artworks[idx] = { ...state.artworks[idx], ...payload };
  } else {
    let slug = Store.slugify(title);
    let n = 2;
    while (state.artworks.some(a => a.id === slug)) slug = Store.slugify(title) + "-" + (n++);
    state.artworks.push({ id: slug, ...payload });
  }

  const featuredCount = state.artworks.filter(a => a.featured).length;
  if (featuredCount > 4) {
    alert("Only 4 artworks can be featured on the homepage at once. Please unfeature another piece first (Homepage tab), or this one won't show there.");
  }

  Store.saveArtworks(state.artworks);
  renderArtworkList();
  renderFeaturedPicker();
  closeArtworkModal();
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
    initArtworkModal();
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
      initArtworkModal();
    });
  });
}

/* ---------------------------------------------------------------- HOMEPAGE */
function initHomepagePanel() {
  document.getElementById("heroImageInput").value = state.site.heroImage || "";
  document.getElementById("heroTaglineInput").value = state.site.tagline || "";
  renderFeaturedPicker();
  document.getElementById("saveHomepageBtn").addEventListener("click", () => {
    state.site.heroImage = document.getElementById("heroImageInput").value.trim();
    state.site.tagline = document.getElementById("heroTaglineInput").value.trim();
    Store.saveSite(state.site);
    Store.saveArtworks(state.artworks);
    alert("Homepage settings saved. Preview the site to see it live.");
  });
}

function renderFeaturedPicker() {
  const mount = document.getElementById("featuredPickerMount");
  mount.innerHTML = state.artworks.map(a => `
    <label style="display:flex; align-items:center; gap:14px; padding:10px 0; border-bottom:1px solid var(--line-dark); cursor:pointer;">
      <input type="checkbox" data-id="${escapeAttr(a.id)}" ${a.featured ? "checked" : ""} style="width:16px;height:16px;" />
      <img src="${escapeAttr(a.image)}" style="width:44px;height:56px;object-fit:cover;" alt="" />
      <span>${escapeHTML(a.title)}</span>
    </label>
  `).join("");
  mount.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", () => {
      const featuredNow = state.artworks.filter(a => a.featured).length;
      if (cb.checked && featuredNow >= 4) {
        cb.checked = false;
        alert("You can feature at most 4 artworks on the homepage. Unfeature one first.");
        return;
      }
      const art = state.artworks.find(a => a.id === cb.dataset.id);
      art.featured = cb.checked;
    });
  });
}

/* ---------------------------------------------------------------- BIOGRAPHY */
function initBioPanel() {
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
    Store.saveSite(state.site);
    alert("Biography saved.");
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
    alert("Contact details saved.");
  });
}

/* ---------------------------------------------------------------- SETTINGS */
function initSettingsPanel() {
  document.getElementById("exportBtn").addEventListener("click", () => Store.downloadExport());
  document.getElementById("resetDraftBtn").addEventListener("click", () => {
    if (!confirm("Discard all unpublished changes in this browser and reload the last published data.js? This can't be undone.")) return;
    Store.clearDraft();
    location.reload();
  });
  document.getElementById("changePwBtn").addEventListener("click", async () => {
    const a = document.getElementById("newPw").value;
    const b = document.getElementById("confirmPw").value;
    const msg = document.getElementById("pwChangeMsg");
    if (a.length < 6) { msg.textContent = "Password should be at least 6 characters."; return; }
    if (a !== b) { msg.textContent = "Passwords don't match."; return; }
    await Store.setPassword(a);
    msg.style.color = "#5c8a5c";
    msg.textContent = "Password updated. You'll use this the next time you log in on this browser.";
    document.getElementById("newPw").value = "";
    document.getElementById("confirmPw").value = "";
  });
}

/* ---------------------------------------------------------------- helpers (shared with main.js) */
function escapeHTML(str) {
  return String(str ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
function escapeAttr(str) { return escapeHTML(str); }
function statusLabel(status) {
  return { available: "Available", sold: "Sold", "not-for-sale": "Not For Sale" }[status] || status;
}
