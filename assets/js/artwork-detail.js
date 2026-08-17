/* ==========================================================================
   ARTWORK DETAIL — reads ?id= from the URL and renders that artwork's
   dedicated page: hero image, title/meta, story, inspiration,
   interpretation, extra images, prev/next, and a related-work strip.
   ========================================================================== */

document.addEventListener("site:ready", () => {
  const artworks = Store.getArtworks();
  const id = qs("id");
  const art = artworks.find(a => a.id === id) || artworks[0];
  if (!art) return;

  document.title = `${art.title} — ${Store.getSite().artistName}`;

  const heroImg = document.getElementById("artHeroImg");
  heroImg.src = art.image;
  heroImg.alt = `${art.title}, ${art.medium}`;

  document.getElementById("artTitle").textContent = art.title;
  document.getElementById("artMeta").innerHTML = `
    <span>${art.year}</span><span>${escapeHTML(art.medium)}</span>
    <span>${escapeHTML(art.dimensions)}</span><span>${escapeHTML(art.category)}</span>
  `;
  const statusEl = document.getElementById("artStatus");
  if (art.status) {
    statusEl.textContent = statusLabel(art.status);
    statusEl.classList.toggle("sold", art.status === "sold");
  }

  setBlock("blockStory", "The Story", art.description);
  setBlock("blockInspiration", "Inspiration", art.inspiration);
  setBlock("blockInterpretation", "Artist's Interpretation", art.interpretation);

  const extraMount = document.getElementById("artExtraImages");
  if (art.images && art.images.length) {
    extraMount.innerHTML = art.images.map(src =>
      `<img src="${escapeAttr(src)}" alt="${escapeAttr(art.title)} — additional view" loading="lazy" data-cursor-view />`
    ).join("");
  } else {
    extraMount.remove();
  }

  const idx = artworks.findIndex(a => a.id === art.id);
  const prev = artworks[(idx - 1 + artworks.length) % artworks.length];
  const next = artworks[(idx + 1) % artworks.length];
  document.getElementById("prevLink").href = `artwork.html?id=${encodeURIComponent(prev.id)}`;
  document.getElementById("prevLink").querySelector("span").textContent = prev.title;
  document.getElementById("nextLink").href = `artwork.html?id=${encodeURIComponent(next.id)}`;
  document.getElementById("nextLink").querySelector("span").textContent = next.title;

  renderRelated(art.id, art.category);
  initLightbox();
  initReveal();
});

function setBlock(id, label, text) {
  const el = document.getElementById(id);
  if (!text) { el.remove(); return; }
  el.querySelector("h4").textContent = label;
  el.querySelector("p").textContent = text;
}

function initLightbox() {
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  const lbImg = lb.querySelector("img");
  document.querySelectorAll("#artHeroImg, #artExtraImages img").forEach(img => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => {
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lb.classList.add("open");
    });
  });
  lb.querySelector(".lightbox-close").addEventListener("click", () => lb.classList.remove("open"));
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.classList.remove("open"); });
}
