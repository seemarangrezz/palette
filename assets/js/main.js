/* ==========================================================================
   MAIN — shared across every page: nav, footer, cursor, scroll reveals,
   mobile menu, and the entry/exit page-transition veil.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const site = Store.getSite();
  injectNav(site);
  injectFooter(site);
  initVeilIn();
  initNavScroll();
  initMobileMenu();
  initCursor();
  initReveal();
  initInternalLinkTransitions();
  document.dispatchEvent(new CustomEvent("site:ready", { detail: { site } }));
});

function injectNav(site) {
  const mount = document.getElementById("site-nav");
  if (!mount) return;
  const page = document.body.dataset.page || "";
  const links = [
    ["index.html", "Home", "home"],
    ["portfolio.html", "Portfolio", "portfolio"],
    ["about.html", "About", "about"],
    ["cv.html", "CV", "cv"],
    ["contact.html", "Contact", "contact"],
  ];
  const linkHTML = (cls) => links.map(([href, label, key]) =>
    `<a href="${href}" class="${key === page ? "active" : ""}">${label}</a>`
  ).join("");

  mount.innerHTML = `
    <nav class="nav" id="mainNav">
      <a href="index.html" class="nav-mark">${escapeHTML(site.artistName)}</a>
      <div class="nav-links">${linkHTML()}</div>
      <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </nav>
    <div class="nav-mobile" id="navMobile">${linkHTML()}</div>
  `;
}

function injectFooter(site) {
  const mount = document.getElementById("site-footer");
  if (!mount) return;
  const socials = [
    ["Instagram", site.contact.instagram],
    ["LinkedIn", site.contact.linkedin],
    ["Facebook", site.contact.facebook],
    ["Pinterest", site.contact.pinterest],
    ["WhatsApp", site.contact.whatsapp],
  ].filter(([, url]) => url);

  mount.innerHTML = `
    <footer>
      <div class="footer-grid">
        <div>
          <div class="footer-mark">${escapeHTML(site.artistName)}</div>
          <div class="label-line" style="margin-top:10px;"><span>${escapeHTML(site.contact.location || "")}</span><span>${escapeHTML(site.contact.email || "")}</span></div>
        </div>
        <div class="footer-links">
          <a href="portfolio.html">Portfolio</a>
          <a href="about.html">About</a>
          <a href="cv.html">CV</a>
          <a href="contact.html">Contact</a>
          ${socials.map(([label, url]) => `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">${label}</a>`).join("")}
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} ${escapeHTML(site.artistName)}. All artwork and images reserved.</span>
        <a href="admin.html">Studio Admin</a>
      </div>
    </footer>
  `;
}

/* ---------- nav scroll + mobile menu ---------- */
function initNavScroll() {
  const nav = document.getElementById("mainNav");
  if (!nav) return;
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initMobileMenu() {
  const toggle = document.getElementById("navToggle");
  const mobile = document.getElementById("navMobile");
  if (!toggle || !mobile) return;
  toggle.addEventListener("click", () => {
    const open = mobile.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  });
  mobile.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    mobile.classList.remove("open");
    document.body.style.overflow = "";
  }));
}

/* ---------- custom cursor (desktop, artwork areas only) ---------- */
function initCursor() {
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.innerHTML = "<span>View</span>";
  document.body.appendChild(dot);
  window.addEventListener("mousemove", (e) => {
    dot.style.left = e.clientX + "px";
    dot.style.top = e.clientY + "px";
  });
  document.addEventListener("mouseover", (e) => {
    dot.classList.toggle("show", !!e.target.closest("[data-cursor-view]"));
  });
}

/* ---------- scroll reveal ---------- */
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
  els.forEach(el => io.observe(el));
}

/* ---------- page load / transition veil ---------- */
function initVeilIn() {
  const veil = document.getElementById("veil");
  if (!veil) return;
  requestAnimationFrame(() => {
    veil.classList.add("hide");
  });
}

function initInternalLinkTransitions() {
  const veil = document.getElementById("veil");
  if (!veil) return;
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto") || a.target === "_blank") return;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      veil.classList.remove("hide");
      veil.classList.add("leaving");
      setTimeout(() => { window.location.href = href; }, 480);
    });
  });
}

/* ---------- helpers ---------- */
function escapeHTML(str) {
  return String(str ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
function escapeAttr(str) { return escapeHTML(str); }

function statusLabel(status) {
  return { available: "Available", sold: "Sold", "not-for-sale": "Not For Sale" }[status] || status;
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}
