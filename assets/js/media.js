/* ==========================================================================
   MEDIA — everything to do with files the artist uploads.

   Two jobs:

   1. OPTIMISE. Camera and phone photos are enormous (8–20 MB) and would
      make a gallery site crawl. Every image is resized and re-encoded in
      the browser before it goes anywhere — typically 8 MB becomes ~350 KB
      with no visible loss at gallery viewing size. The artist doesn't
      have to know or do anything.

   2. STORE. If a Supabase project is connected, files go to cloud storage
      and come back as normal public https:// links. If not, they're kept
      in this browser's IndexedDB (which, unlike localStorage, comfortably
      holds hundreds of megabytes) so uploading still works for previewing.

   Both paths return the same thing — a URL string — so the rest of the
   site never has to care which mode it's in.
   ========================================================================== */

const Media = (() => {
  const DB_NAME = "gallery_studio_v1";
  const DB_VERSION = 1;

  /* ------------------------------------------------------------ IndexedDB */
  let dbPromise = null;

  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains("state")) d.createObjectStore("state");
        if (!d.objectStoreNames.contains("files")) d.createObjectStore("files");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function idbGet(store, key) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(store, "readonly").objectStore(store).get(key);
      tx.onsuccess = () => resolve(tx.result ?? null);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbPut(store, key, value) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(store, "readwrite").objectStore(store).put(value, key);
      tx.onsuccess = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbDelete(store, key) {
    const d = await db();
    return new Promise((resolve) => {
      const tx = d.transaction(store, "readwrite").objectStore(store).delete(key);
      tx.onsuccess = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  async function idbAll(store) {
    const d = await db();
    return new Promise((resolve) => {
      const os = d.transaction(store, "readonly").objectStore(store);
      const keysReq = os.getAllKeys();
      const valsReq = os.getAll();
      let keys = null, vals = null;
      const done = () => {
        if (keys && vals) resolve(keys.map((k, i) => ({ key: k, value: vals[i] })));
      };
      keysReq.onsuccess = () => { keys = keysReq.result; done(); };
      valsReq.onsuccess = () => { vals = valsReq.result; done(); };
      keysReq.onerror = valsReq.onerror = () => resolve([]);
    });
  }

  /* ------------------------------------------------------- image handling */
  const IMAGE_TYPES = /^image\/(jpeg|jpg|png|webp|gif|bmp|heic|heif|avif)$/i;

  function isImage(file) {
    return IMAGE_TYPES.test(file.type) || /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(file.name);
  }

  function readAsDataURL(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error("Could not read that file."));
      r.readAsDataURL(blob);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("That file doesn't look like an image we can open."));
      img.src = src;
    });
  }

  /* Resize + re-encode. SVGs are passed through untouched (they're already
     tiny and scaling them would defeat the point). */
  async function optimise(file) {
    if (/svg/i.test(file.type)) {
      return { blob: file, ext: "svg", width: 0, height: 0, type: file.type };
    }
    const dataUrl = await readAsDataURL(file);
    const img = await loadImage(dataUrl);

    const max = APP_CONFIG.MAX_IMAGE_EDGE || 2400;
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    /* White matte behind transparency so PNG logos don't turn black as JPEG. */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", APP_CONFIG.IMAGE_QUALITY || 0.86)
    );

    /* If our "optimised" version somehow came out bigger, keep the original. */
    if (!blob || blob.size > file.size) {
      return { blob: file, ext: extOf(file.name) || "jpg", width: img.naturalWidth, height: img.naturalHeight, type: file.type };
    }
    return { blob, ext: "jpg", width: w, height: h, type: "image/jpeg" };
  }

  function extOf(name) {
    const m = String(name).match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : "";
  }

  function safeName(name) {
    return String(name)
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || "file";
  }

  function humanSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  }

  /* ------------------------------------------------------------- uploading */
  /* One call, both modes. onProgress(0–100) fires as it goes so the UI can
     show a real progress bar rather than a spinner that lies. */
  async function upload(file, options = {}) {
    const onProgress = options.onProgress || (() => {});
    const folder = options.folder || "artworks";

    onProgress(5);
    let payload;
    if (isImage(file)) {
      payload = await optimise(file);
    } else {
      payload = { blob: file, ext: extOf(file.name) || "bin", type: file.type };
    }
    onProgress(25);

    const stamp = Date.now().toString(36);
    const path = `${folder}/${safeName(file.name)}-${stamp}.${payload.ext}`;

    if (Cloud.enabled && Cloud.isSignedIn()) {
      const url = await Cloud.uploadFile(path, payload.blob, (p) =>
        onProgress(25 + Math.round(p * 0.75))
      );
      onProgress(100);
      return {
        url,
        path,
        name: file.name,
        size: payload.blob.size,
        width: payload.width,
        height: payload.height,
        stored: "cloud",
      };
    }

    /* Local fallback — a data URL, saved in IndexedDB for the media library
       and embedded directly in the content so every page can render it. */
    const dataUrl = await readAsDataURL(payload.blob);
    onProgress(90);
    await idbPut("files", path, {
      dataUrl,
      name: file.name,
      size: payload.blob.size,
      createdAt: Date.now(),
    });
    onProgress(100);
    return {
      url: dataUrl,
      path,
      name: file.name,
      size: payload.blob.size,
      width: payload.width,
      height: payload.height,
      stored: "local",
    };
  }

  /* ---------------------------------------------------------- media library */
  async function library() {
    if (Cloud.enabled && Cloud.isSignedIn()) {
      const folders = ["artworks", "portrait", "documents"];
      const all = [];
      for (const f of folders) {
        const files = await Cloud.listFiles(f);
        all.push(...files);
      }
      return all.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    }
    const rows = await idbAll("files");
    return rows
      .map((r) => ({
        name: r.value.name,
        path: r.key,
        url: r.value.dataUrl,
        size: r.value.size,
        createdAt: r.value.createdAt,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async function remove(path) {
    if (Cloud.enabled && Cloud.isSignedIn()) return Cloud.deleteFile(path);
    return idbDelete("files", path);
  }

  /* --------------------------------------------------------- local content */
  async function getLocalState(id) {
    return idbGet("state", id);
  }
  async function setLocalState(id, data) {
    return idbPut("state", id, data);
  }
  async function clearLocalState(id) {
    return idbDelete("state", id);
  }

  return {
    upload, optimise, isImage, humanSize, safeName, readAsDataURL,
    library, remove,
    getLocalState, setLocalState, clearLocalState,
  };
})();
