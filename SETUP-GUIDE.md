# Setting Up Your Website

Written for you, not for a developer. There is no code to write anywhere in
this guide — you'll be copying two lines of text and pasting one script.

---

## Part 1 — Using the site right now (no setup at all)

You can open `admin.html` today and start working.

1. Open your website and click **Admin** in the top navigation.
2. Sign in with the password `changeme123`.
3. Add artworks, drag photos in, write your stories.

Everything saves to **the browser you're sitting at**. That's genuinely useful
for trying things out, but be clear about what it means:

- Your edits won't appear on your phone, or your husband's laptop, or anyone
  else's computer.
- Visitors to your website won't see them either.
- Clearing your browser history could erase them.

So do Part 2 before you show the site to a gallery.

---

## Part 2 — Connecting a database (about ten minutes, once, forever)

This gives you a real website: edit from any device, everyone sees your work,
nothing is tied to one computer. It's free — the service is called Supabase,
and an artist portfolio sits comfortably inside their free tier.

### Step 1 — Make an account and a project

1. Go to **supabase.com** and sign up (a Google or GitHub account is fastest).
2. Click **New project**.
3. Give it any name — `my-art-site` is fine.
4. Choose a **database password**. Write it down somewhere safe. You won't need
   it for day-to-day use, but you can't recover it later.
5. Pick the region closest to you and click **Create new project**.
6. Wait about two minutes while it builds.

### Step 2 — Set up the storage

1. In the left sidebar, click **SQL Editor**.
2. Click **New query**.
3. Open the file `supabase-setup.sql` from this project folder, select all of
   it, and copy it. (Or: sign into your admin dashboard → **Connection** tab →
   **Copy the setup script**.)
4. Paste it into the big empty box.
5. Click **Run** (bottom right).

You should see *Success. No rows returned*. That's exactly right — it means the
content table and the photo storage were created.

### Step 3 — Create your login

1. In the left sidebar, click **Authentication**, then **Users**.
2. Click **Add user** → **Create new user**.
3. Enter the **email address** and **password** you want to use to sign into
   your own website. This is yours to choose — it doesn't have to match
   anything else.
4. Tick **Auto Confirm User**. This matters: without it, the account can't sign
   in until it clicks a confirmation email.
5. Click **Create user**.

### Step 4 — Tell your website where its database is

1. In the left sidebar, click **Project Settings** (the gear), then **API**.
2. You'll see two things you need:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — a very long string of letters and numbers
3. Open the file `assets/js/config.js` in this project. Any text editor works —
   Notepad, TextEdit, VS Code.
4. Find these two lines near the top:

   ```
   SUPABASE_URL: "",
   SUPABASE_ANON_KEY: "",
   ```

5. Paste your two values **between the quote marks**, like this:

   ```
   SUPABASE_URL: "https://abcdefgh.supabase.co",
   SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
   ```

   Keep the quote marks and the commas. That's the whole edit.

6. Save the file and upload it to wherever your website is hosted, replacing
   the old one.

### Step 5 — Sign in

Open your website, click **Admin**, and sign in with the email and password
from Step 3.

The login screen should now say **Connected to your database**. Open the
**Connection** tab and you should see five green ticks.

That's it. You're done, permanently.

---

## Is the "anon public" key safe to put in a file?

Yes — that's what it's designed for, and it's why the setup script matters.

The script sets rules on the database itself: anyone holding that key can
**read your published website** and nothing else. Reading your unpublished
draft, changing any content, or uploading a photo all require being signed in
as you. The key on its own can't do any of those things.

Your database password from Step 1 and your login password from Step 3 are the
secrets. Never put those in any file.

---

## How the dashboard works

### Draft and Published

Everything you type saves itself to a **private draft** a moment after you stop
typing. The bar at the top of the dashboard tells you so.

Nothing reaches your public website until you press **Publish to Website**.
Until then you can preview freely, change your mind, or press *Discard Draft*
in Settings to snap back to whatever is currently live.

The orange **Unpublished changes** chip means: you've done work that visitors
can't see yet.

### Adding an artwork

**Artworks → + Add Artwork**. Drag the photographs straight from your desktop
onto the dotted panel — or click it to browse, or copy an image and press
Ctrl+V (Cmd+V on a Mac).

Photos are resized automatically. You can upload straight from your camera or
phone; a 12-megapixel photo becomes a fast-loading web image without you doing
anything.

The **first photo is the one visitors see** in the gallery. Drag the thumbnails
to reorder them, or hover a thumbnail and press ★ to promote it.

**Hidden** vs **Delete**: Hide keeps the piece in your archive but takes it off
the website. Delete is permanent. When in doubt, hide.

### Your portrait and the homepage image

- **Biography → Artist Portrait** — the photo on your About page and homepage
  introduction. Portrait orientation (taller than wide) fits the layout best.
- **Homepage → Hero Image** — the first thing anyone sees. A wide,
  high-resolution photograph works best.

Both use the same drag-and-drop panel as artworks.

### Photos & Files

Every image you've ever uploaded lives here. Drag new ones in, delete old ones,
and reuse anything anywhere on the site via the **Media library** button that
appears on every upload panel — no need to upload the same photo twice.

### Your CV

Fill in the structured sections and the site typesets a clean PDF for you when
a visitor presses Download CV.

If you'd rather serve your own document, upload a PDF under **CV → Upload Your
Own CV** and that file becomes the download instead. Remove it to go back to
the generated version.

### Backups

**Settings → Download Backup** saves one file containing every artwork, story
and detail on your site. Do this before any big change. **Restore From Backup**
puts it all back.

It's also how you move content between browser-only mode and a connected
database: download a backup before connecting, restore it after signing in.

---

## If something goes wrong

**"We couldn't sign you in."**
Check the email and password from Step 3. If you didn't tick *Auto Confirm
User*, go to Authentication → Users, click your user, and confirm it.

**Connection tab shows "content table is missing"**
Step 2 didn't run. Go back to the SQL Editor and run the script again — running
it twice is harmless.

**Connection tab shows "storage bucket not found"**
Same fix. The script creates the bucket; re-running it is safe.

**"Upload not permitted — please sign in again."**
Your session expired. Log out and back in.

**A photo won't upload**
Files over 40 MB are rejected on purpose. Export a smaller version — anything
above about 4000 pixels on its longest edge is more than a website can use.

**I edited config.js and now the site is blank**
A quote mark or comma probably went missing. The two lines must look exactly
like this, including every punctuation mark:

```
SUPABASE_URL: "https://yourproject.supabase.co",
SUPABASE_ANON_KEY: "your-long-key-here",
```

If you're stuck, empty both back to `""` — the site returns to browser-only
mode and nothing is lost.

---

## Where things live

| File | What it is |
|---|---|
| `assets/js/config.js` | The only file you ever edit by hand — your two database values |
| `supabase-setup.sql` | The script you paste into Supabase once, in Step 2 |
| `admin.html` | Your dashboard |
| `assets/js/data.js` | Starter content, used before your database has anything in it |

Everything else runs the website and shouldn't need touching.
