/* ==========================================================================
   CONFIG — the only file you ever need to touch by hand.

   Paste the two values from your free Supabase project below and the whole
   site switches from "browser-only preview" to a real, shared database:

     • Artworks, biography, CV and contact details live in the database
     • Uploaded photos live in cloud file storage
     • You can log in and edit from ANY computer or phone
     • Every visitor sees the same, published content

   Where to find these two values:
     Supabase dashboard → Project Settings → API
       SUPABASE_URL       →  "Project URL"
       SUPABASE_ANON_KEY  →  "anon public" key

   Full step-by-step instructions (no coding): see SETUP-GUIDE.md

   Leave them empty and the site still works perfectly — it just saves to
   this browser only, which is fine for trying things out.
   ========================================================================== */

const APP_CONFIG = {
  SUPABASE_URL: "https://ddomntsszzdeniqyuzpv.supabase.co/rest/v1/",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkb21udHNzenpkZW5pcXl1enB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTIxMTUsImV4cCI6MjEwMjU2ODExNX0.9tseBmpkhSVWunWH2aDuN6AlJmS5U6xgqcmZctn6Xa8",

  /* Storage bucket name — leave as-is unless you named yours differently. */
  BUCKET: "gallery-media",

  /* Largest edge (px) an uploaded photo is resized to before saving.
     2400 keeps gallery-quality detail while staying fast to load. */
  MAX_IMAGE_EDGE: 2400,

  /* JPEG quality for uploaded photos (0–1). 0.86 is visually lossless
     for artwork photography at the size above. */
  IMAGE_QUALITY: 0.86,
};

/* Convenience flag used across the site. */
APP_CONFIG.CLOUD_ENABLED = Boolean(
  APP_CONFIG.SUPABASE_URL && APP_CONFIG.SUPABASE_ANON_KEY
);
