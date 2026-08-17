# Your Name — Contemporary Visual Artist

A premium, gallery-style personal website: cinematic homepage, filterable
portfolio, individual artwork "story" pages, an editorial About page, a
CV page with a print-to-PDF download button, a Contact page with an
inquiry form, and a password-gated **Studio Admin** dashboard so you can
manage everything — artworks, biography, CV, contact details — without
touching code.

It's plain HTML/CSS/JS with no build step, so it runs perfectly on
**GitHub Pages for free.**

---

## 1. Quick start — see it locally

Because the site loads JavaScript modules and images relative to the page,
it needs to be served over `http://`, not opened directly as a `file://`.
The simplest way:

```bash
cd artist-website
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

(Any static server works — VS Code's "Live Server" extension, `npx serve`, etc.)

---

## 2. Put your name and content in

Two ways to do this — pick whichever you prefer:

### Option A — the Admin Dashboard (recommended, no code)
1. Open `admin.html` (locally or once deployed).
2. Log in with the default password **`changeme123`**, then immediately
   go to **Publish & Settings → Change Admin Password** and set your own.
3. Use the tabs on the left — Artworks, Collections, Homepage, Biography,
   CV, Contact & Social — to fill in your real information. Every change
   previews live on the site instantly (in this browser).
4. When you're happy, go to **Publish & Settings** and click
   **Export data.js**. This downloads an updated `data.js` file.
5. Replace `assets/js/data.js` in this project with the downloaded file,
   then commit and push to GitHub (see Section 3). That push is what
   actually makes your changes visible to visitors — the Admin dashboard
   only edits a private draft inside your own browser.

### Option B — edit the file directly
Open `assets/js/data.js` in any text editor. It's one plain JavaScript
object (`SITE_DATA`) and one array (`ARTWORKS`) — change the values,
save, commit, push.

**Why this two-step "draft → export → replace the file" flow exists:**
GitHub Pages is a *static* host — there's no server or database behind
it, so nothing typed into the Admin dashboard can save itself back into
your repository automatically. This pattern gives you a real,
no-hosting-cost CMS workflow anyway: edit visually, preview instantly,
publish by replacing one file.

---

## 3. Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `your-name-art`).
2. Push this entire `artist-website` folder's contents to the repo root:
   ```bash
   cd artist-website
   git init
   git add .
   git commit -m "Launch artist website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source → Deploy from branch →
   `main` / root**. Save.
4. Your site will be live in a minute or two at
   `https://YOUR-USERNAME.github.io/YOUR-REPO/`.
5. Optional: add a custom domain under **Settings → Pages → Custom domain**.

Every time you want to publish an update (new artwork, edited bio, a
password change reflected via a new `data.js`, etc.), just commit and
push again — GitHub Pages redeploys automatically.

---

## 4. Add your own artwork photography

The site ships with elegant abstract placeholder images
(`assets/images/artworks/*.svg`) so the gallery looks complete on day
one. Replace them with real photos whenever ready:

1. Photograph each piece on a neutral background in even light.
2. Export as `.jpg`, roughly 1600–2400px on the long edge, ideally under
   ~500KB each so the site stays fast.
3. Add the file to `assets/images/artworks/`.
4. Point that artwork's "Image Path" to the new filename — either in the
   Admin dashboard's artwork editor, or directly in `data.js`.

The site supports **hundreds of artworks** without any redesign — the
portfolio grid, filters, and detail pages are all data-driven.

---

## 5. Connect the contact form to actually send email

By default, the contact form falls back to opening a pre-filled email in
the visitor's mail client — it works immediately, no setup required.

To have it send directly instead:
1. Create a free form endpoint at [Formspree](https://formspree.io) (or
   any similar service — Getform, Basin, etc.).
2. Copy the endpoint URL they give you.
3. Paste it into **Admin → Contact & Social → Form Endpoint**, or set
   `contact.formEndpoint` in `data.js` directly.
4. Export/publish as usual. The form will now submit there and show an
   in-page success message instead of opening email.

---

## 6. A note on the Admin login

The Admin dashboard is protected by a password stored (hashed) in your
browser's `localStorage`, checked entirely client-side. That's
appropriate for a **static, no-backend site with no sensitive data
behind it** — it stops casual snooping, not a determined attacker. Two
things follow from that:

- The password is *per browser*. If you log in from a new device, use
  whatever the current password is (check with yourself / reset via
  `data.js` if forgotten — see below).
- Don't put anything genuinely sensitive behind it. Everything an admin
  can edit here (artwork info, bio, contact details) is content you'd be
  comfortable existing in a public GitHub repo anyway.

**Forgot the admin password?** Open your browser console on `admin.html`
and run `localStorage.removeItem('gallery_admin_pw_hash_v1')`, then
reload — it resets to the default `changeme123`.

If you later want real server-backed authentication (for a team, or a
genuinely private admin area), you'd move to a platform with a backend —
e.g. Netlify/Vercel + a small auth service — which is a bigger step up
from a free static GitHub Pages site.

---

## 7. Project structure

```
artist-website/
├── index.html            Homepage
├── portfolio.html         Filterable gallery
├── artwork.html            Individual artwork page (reads ?id=)
├── about.html              Editorial biography
├── cv.html                  CV + "Download CV (PDF)" (browser print)
├── contact.html              Contact + inquiry form
├── admin.html                  Studio Admin dashboard
├── 404.html                     Custom not-found page
├── assets/
│   ├── css/
│   │   ├── style.css        Full design system + admin styles
│   │   └── print.css         CV → PDF print stylesheet
│   ├── js/
│   │   ├── data.js            ALL editable content lives here
│   │   ├── store.js            Data layer (data.js + admin draft)
│   │   ├── main.js              Nav, footer, cursor, scroll reveals
│   │   ├── gallery.js            Portfolio grid + featured strip
│   │   ├── artwork-detail.js      Single artwork page rendering
│   │   ├── contact.js              Contact form logic
│   │   └── admin.js                 Admin dashboard logic
│   └── images/artworks/               Artwork images (placeholders included)
├── robots.txt
└── .nojekyll
```

Nothing about artwork content is hard-coded into the HTML — every page
reads from `data.js` (or the live admin draft), so you can add hundreds
of artworks or rewrite your entire bio without ever touching markup.

---

## 8. Design system, in brief

- **Palette** drawn from the artist's own materials: ink black, gallery
  plaster white, antique gilt gold (Tanjore leaf), oxide clay (Lippan
  mud / Tanjore ground).
- **Type**: Fraunces (display/serif) for headlines and titles, Inter for
  body copy, IBM Plex Mono for "museum wall label" metadata (medium,
  year, dimensions) — used consistently everywhere an artwork is
  referenced, which is the site's signature device.
- **Motion**: scroll-triggered reveals, image scale-ins, a soft page
  transition veil, and a small "View" cursor over artwork — all built to
  respect `prefers-reduced-motion`.

Change the palette by editing the CSS custom properties at the top of
`assets/css/style.css` (`:root { --ink: ...; --gold: ...; }` etc.).
