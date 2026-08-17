# Contemporary Visual Artist — Digital Gallery

A premium, gallery-style personal website: cinematic homepage, filterable
portfolio, individual artwork "story" pages, an editorial About page, a CV page
with PDF download, a Contact page with an inquiry form, and a **Studio Admin**
dashboard so the artist manages everything — artworks, photographs, biography,
CV, contact details — without touching code.

Plain HTML/CSS/JS with no build step, so it hosts anywhere for free.

**New in this version — a real backend.**

| | Before | Now |
|---|---|---|
| Photos | Copy files into a folder by hand, type the path | Drag, drop or paste — resized and uploaded automatically |
| Storage | One browser only (`localStorage`) | Shared cloud database, or IndexedDB as a fallback |
| Login | Browser passphrase | Real email + password account with sessions |
| Publishing | Export a file, commit, push | Press **Publish to Website** |
| Admin entry | Small footer link | **Admin** button in the main navigation |

**→ Setup takes about ten minutes and involves no coding. See
[`SETUP-GUIDE.md`](SETUP-GUIDE.md).**

---

## Architecture

```
config.js     your two database values — the only file edited by hand
   ↓
cloud.js      dependency-free Supabase REST client (auth, content, storage)
media.js      IndexedDB + browser-side image optimisation
   ↓
store.js      draft / published state, in-memory cache, sync getters
   ↓
main.js       nav, footer, scroll reveals, page transitions
gallery.js    portfolio grid, featured strip, related works
admin.js      the dashboard
uploader.js   drag-and-drop upload components + media library
```

**Content model.** Two JSON documents in one table: `draft` (what the artist is
working on) and `published` (what visitors see). Editing writes the draft;
Publish copies it across. Nothing about the artwork is hard-coded in the markup,
and adding hundreds of pieces needs no schema changes.

**Security.** Row-level security means the anon key in `config.js` can read the
published site and nothing else — reading the draft, writing content and
uploading files all require an authenticated session. Full explanation in the
setup guide.

**Graceful degradation.** With no database configured, the site runs entirely on
IndexedDB and says so plainly in the dashboard rather than pretending to be
connected. Uploads still work; they just stay on that machine.

**Images.** Every upload is resized to 2400px on its longest edge and re-encoded
in the browser before it goes anywhere — a 12-megapixel phone photo becomes
roughly 350 KB with no visible loss at gallery viewing size. Tunable in
`config.js`.

---

## 1. Quick start — see it locally

Because the site loads scripts and images relative to the page, it needs to be
served over `http://`, not opened as a `file://`.

```bash
cd artist-website
python3 -m http.server 8000
# then open http://localhost:8000
```

Click **Admin** in the navigation. Default password: `changeme123`.

---

## 2. Put your content in

Open **Admin** in the navigation and use the tabs on the left — Artworks,
Photos & Files, Collections, Homepage, Biography, CV, Contact & Social.

Every change saves itself to a private draft. Press **Publish to Website** when
you want visitors to see it. There is no file to export and no path to type: drag
photographs onto any upload panel and they're optimised, uploaded and remembered
in your Media Library.

Full walkthrough for a non-technical user: [`SETUP-GUIDE.md`](SETUP-GUIDE.md).

The bundled `assets/js/data.js` is only starter content — it's what a brand-new
visitor sees before your database has anything in it, and what seeds your project
on first sign-in. Once you're connected you can ignore it.

---

## 3. Connect the database

Summarised here; the step-by-step version with screenshots-in-words is in
[`SETUP-GUIDE.md`](SETUP-GUIDE.md).

1. Create a free project at **supabase.com**.
2. **SQL Editor → New query**, paste [`supabase-setup.sql`](supabase-setup.sql),
   press Run. This creates the `site_state` table, the `gallery-media` storage
   bucket, and the row-level-security policies.
3. **Authentication → Users → Add user** — the email and password you'll sign in
   with. Tick *Auto Confirm User*.
4. **Project Settings → API** — copy the Project URL and the `anon public` key
   into `assets/js/config.js`.
5. Sign in. The **Connection** tab in the dashboard verifies all five steps and
   tells you in plain English which one failed if any did.

The same SQL is available inside the dashboard under **Connection → Copy the
setup script**, so it can never drift out of sync with what the code expects.

---

## 4. Deploying

Any static host works — GitHub Pages, Netlify, Vercel, Cloudflare Pages, or a
plain folder on shared hosting. There's no build step and no server to run.

For GitHub Pages: push the folder, then **Settings → Pages → Deploy from branch**
and pick `main` / root. The `.nojekyll` file is already present so the `assets`
directory is served correctly.

Once a database is connected, deploying is a one-time act — after that, content
changes happen in the dashboard and never touch the repository.

---

## 5. Security notes

**Cloud mode.** Authentication is handled by Supabase: passwords are hashed
server-side and sessions are JWTs with refresh tokens. Row-level security allows
anonymous reads of the `published` row only; the `draft` row, all writes and all
uploads require an authenticated session. The `anon` key in `config.js` is
designed to be public and can't do anything the policies don't permit.

**Browser-only mode.** The fallback password is a SHA-256 hash in `localStorage`,
checked client-side. It's a convenience lock for a private preview, not real
security, and the login screen says as much rather than implying otherwise. Don't
put anything sensitive behind it. Forgotten? Open the browser console and run
`localStorage.removeItem('gallery_admin_pw_hash_v1')` to reset it to
`changeme123`.

**Contact form.** Set `contact.formEndpoint` under Contact & Social to a
Formspree (or similar) URL to receive inquiries by email. Left empty, the form
falls back to opening the visitor's mail client.

---

## 6. Accessibility & performance

- Semantic landmarks, skip link, visible focus states, and `prefers-reduced-motion`
  honoured throughout — every animation collapses to an instant state change.
- All imagery carries alt text; artwork alt text is generated from the title and
  medium.
- Images lazy-load below the fold and are capped at 2400px on upload, so a
  hundred-piece portfolio stays fast.
- Scroll reveals use `IntersectionObserver`, not scroll listeners.
- Print stylesheet (`print.css`) typesets the CV page cleanly for PDF export.

---

## 7. File structure

```
├── index.html                  Home — hero, featured strip, practice, CTA
├── portfolio.html              Filterable gallery
├── artwork.html                Individual artwork story page (?id=slug)
├── about.html                  Editorial biography
├── cv.html                     Professional CV + PDF download
├── contact.html                Inquiry form + details
├── admin.html                  Studio Admin dashboard
├── supabase-setup.sql          Run once in Supabase
├── SETUP-GUIDE.md              Non-technical setup + usage guide
└── assets/
    ├── css/
    │   ├── style.css           Design system + all components
    │   └── print.css           CV print/PDF styling
    ├── js/
    │   ├── config.js           ← the only file you edit by hand
    │   ├── cloud.js            Supabase REST client (auth, content, storage)
    │   ├── media.js            IndexedDB + image optimisation
    │   ├── uploader.js         Drag-and-drop components + media library
    │   ├── store.js            Draft/published state layer
    │   ├── data.js             Starter content
    │   ├── main.js             Nav, footer, cursor, reveals, transitions
    │   ├── gallery.js          Grid, filters, featured strip
    │   ├── artwork-detail.js   Artwork page + lightbox
    │   ├── contact.js          Contact page + form handling
    │   └── admin.js            Dashboard
    └── images/artworks/        Starter imagery
```

Nothing about the artwork is hard-coded into any page — every template reads
through `Store`, so hundreds of pieces can be added without touching the design.
