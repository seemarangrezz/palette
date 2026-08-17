/* ==========================================================================
   GALLERY — renders artwork cards from live data (Store), used on the
   portfolio page, the homepage featured strip, and "more from this
   collection" strips on artwork detail pages.
   ========================================================================== */

function artworkCardHTML(art) {
  return `
    <a class="g-card reveal reveal-img" href="artwork.html?id=${encodeURIComponent(art.id)}" data-cursor-view aria-label="View ${escapeHTML(art.title)}">
      <div class="g-img">
        <img src="${escapeAttr(art.image)}" alt="${escapeAttr(art.title)}, ${escapeAttr(art.medium)}" loading="lazy" />
        ${art.status && art.status !== "available" ? `<span class="g-status ${art.status === "sold" ? "sold" : ""}">${statusLabel(art.status)}</span>` : ""}
        <div class="g-view"><span>View Artwork</span></div>
      </div>
      <div class="g-info">
        <h3>${escapeHTML(art.title)}</h3>
        <div class="label-line"><span>${art.year}</span><span>${escapeHTML(art.category)}</span></div>
      </div>
    </a>
  `;
}

function initPortfolioGrid() {
  const grid = document.getElementById("galleryGrid");
  const filterMount = document.getElementById("filterBar");
  const emptyState = document.getElementById("emptyState");
  if (!grid) return;

  const artworks = Store.getArtworks().slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const categories = Store.getCategories();
  const params = new URLSearchParams(window.location.search);
  let active = params.get("category") || "All";

  function renderFilters() {
    const all = ["All", ...categories];
    filterMount.innerHTML = all.map(cat =>
      `<button class="filter-btn ${cat === active ? "active" : ""}" data-cat="${escapeAttr(cat)}">${escapeHTML(cat)}</button>`
    ).join("");
    filterMount.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        active = btn.dataset.cat;
        renderFilters();
        renderGrid();
      });
    });
  }

  function renderGrid() {
    const filtered = active === "All" ? artworks : artworks.filter(a => a.category === active);
    grid.innerHTML = filtered.map(artworkCardHTML).join("");
    emptyState.classList.toggle("hidden", filtered.length > 0);
    initReveal();
  }

  renderFilters();
  renderGrid();
}

function renderFeaturedStrip() {
  const mount = document.getElementById("featuredStrip");
  if (!mount) return;
  const featured = Store.getArtworks().filter(a => a.featured).slice(0, 4);
  const layoutClasses = ["f-1", "f-2", "f-3", "f-4"];
  mount.innerHTML = featured.map((art, i) => `
    <a class="f-card reveal ${layoutClasses[i] || "f-2"}" href="artwork.html?id=${encodeURIComponent(art.id)}" data-cursor-view>
      <img src="${escapeAttr(art.image)}" alt="${escapeAttr(art.title)}" loading="lazy" />
      <div class="f-meta">
        <h3>${escapeHTML(art.title)}</h3>
        <div class="label-line"><span>${escapeHTML(art.medium)}</span><span>${art.year}</span></div>
      </div>
    </a>
  `).join("");
  initReveal();
}

function renderRelated(currentId, category) {
  const mount = document.getElementById("relatedStrip");
  if (!mount) return;
  const related = Store.getArtworks().filter(a => a.id !== currentId && a.category === category).slice(0, 3);
  const pool = related.length ? related : Store.getArtworks().filter(a => a.id !== currentId).slice(0, 3);
  mount.innerHTML = pool.map(artworkCardHTML).join("");
  initReveal();
}
