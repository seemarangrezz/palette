/* ==========================================================================
   UPLOADER — the drag-and-drop file experience.

   Written for someone who has never touched code and shouldn't have to.
   It behaves the way people expect a modern document library to behave:

     • Drag photos straight from your desktop onto the dotted panel
     • Or click it and pick files the normal way
     • Or paste a screenshot with Ctrl/Cmd + V
     • Every file shows a thumbnail and a real progress bar
     • Anything that fails says why, in plain English, with a Retry button
     • Already-uploaded photos can be re-used from the Media Library

   Three components, all mounted onto an empty <div>:

     Uploader.single(el, opts)   one photo   (hero image, artist portrait)
     Uploader.gallery(el, opts)  many photos (an artwork's images)
     Uploader.file(el, opts)     a document  (CV PDF)
   ========================================================================== */

const Uploader = (() => {
  let uid = 0;

  /* ------------------------------------------------------------- helpers */
  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function esc(str) {
    return String(str ?? "").replace(/[&<>"']/g, (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
    );
  }

  const ICON_CLOUD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4"/><path d="m8 8 4-4 4 4"/><path d="M20 16.5A3.5 3.5 0 0 0 18 10h-.8A6 6 0 1 0 6.3 15.4"/><path d="M4 20h16"/></svg>`;

  /* Turn a drop-zone element into a working drop target. */
  function wireDropZone(zone, input, onFiles) {
    let depth = 0;
    ["dragenter", "dragover"].forEach((ev) =>
      zone.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (ev === "dragenter") depth++;
        zone.classList.add("is-dragging");
      })
    );
    ["dragleave", "drop"].forEach((ev) =>
      zone.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (ev === "dragleave") depth--;
        if (depth <= 0 || ev === "drop") {
          depth = 0;
          zone.classList.remove("is-dragging");
        }
      })
    );
    zone.addEventListener("drop", (e) => {
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) onFiles(files);
    });
    zone.addEventListener("click", (e) => {
      if (e.target.closest("[data-no-browse]")) return;
      input.click();
    });
    zone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        input.click();
      }
    });
    input.addEventListener("change", () => {
      const files = Array.from(input.files || []);
      if (files.length) onFiles(files);
      input.value = "";
    });
  }

  /* Paste-to-upload, scoped so it only fires while the panel is on screen. */
  function wirePaste(zone, onFiles) {
    const handler = (e) => {
      if (!document.body.contains(zone)) {
        document.removeEventListener("paste", handler);
        return;
      }
      if (!zone.closest(".admin-panel.active, .editor-modal.open")) return;
      const files = Array.from(e.clipboardData?.files || []);
      if (files.length) onFiles(files);
    };
    document.addEventListener("paste", handler);
  }

  /* One row in the upload queue: thumbnail, name, progress, status. */
  function queueRow(file) {
    const row = el(`
      <div class="up-row">
        <div class="up-row-thumb"></div>
        <div class="up-row-body">
          <div class="up-row-name">${esc(file.name)}</div>
          <div class="up-row-bar"><span></span></div>
          <div class="up-row-status">Preparing…</div>
        </div>
        <button type="button" class="up-row-retry" hidden>Retry</button>
      </div>
    `);
    if (Media.isImage(file)) {
      Media.readAsDataURL(file)
        .then((src) => {
          row.querySelector(".up-row-thumb").style.backgroundImage = `url("${src}")`;
        })
        .catch(() => {});
    }
    return {
      node: row,
      progress(p, label) {
        row.querySelector(".up-row-bar span").style.width = p + "%";
        row.querySelector(".up-row-status").textContent =
          label || (p < 25 ? "Optimising photo…" : p < 100 ? "Uploading… " + p + "%" : "Done");
      },
      done(size) {
        row.classList.add("is-done");
        row.querySelector(".up-row-bar span").style.width = "100%";
        row.querySelector(".up-row-status").textContent =
          "Uploaded" + (size ? " · " + Media.humanSize(size) : "");
        setTimeout(() => row.remove(), 2200);
      },
      fail(msg, onRetry) {
        row.classList.add("is-error");
        row.querySelector(".up-row-status").textContent = msg;
        const btn = row.querySelector(".up-row-retry");
        btn.hidden = false;
        btn.onclick = () => {
          row.remove();
          onRetry();
        };
      },
    };
  }

  /* Run a set of files through Media.upload, one at a time, with UI. */
  async function processFiles(files, queueMount, folder, onEach, opts = {}) {
    const list = Array.from(files);
    for (const file of list) {
      if (opts.imagesOnly && !Media.isImage(file)) {
        const row = queueRow(file);
        queueMount.appendChild(row.node);
        row.fail("That's not an image file — try a JPG, PNG or WEBP.", () => {});
        continue;
      }
      if (file.size > 40 * 1024 * 1024) {
        const row = queueRow(file);
        queueMount.appendChild(row.node);
        row.fail("That file is over 40 MB — please use a smaller export.", () => {});
        continue;
      }
      const row = queueRow(file);
      queueMount.appendChild(row.node);
      const attempt = async () => {
        const r = queueRow(file);
        queueMount.appendChild(r.node);
        try {
          const res = await Media.upload(file, { folder, onProgress: (p) => r.progress(p) });
          r.done(res.size);
          onEach(res);
        } catch (e) {
          r.fail(e.message || "Upload failed.", attempt);
        }
      };
      try {
        const res = await Media.upload(file, { folder, onProgress: (p) => row.progress(p) });
        row.done(res.size);
        onEach(res);
      } catch (e) {
        row.fail(e.message || "Upload failed.", attempt);
      }
    }
  }

  /* ------------------------------------------------------------ dropzone UI */
  function dropZoneHTML(id, opts) {
    return `
      <div class="up-zone" tabindex="0" role="button" aria-label="${esc(opts.label || "Upload files")}">
        <div class="up-zone-icon">${ICON_CLOUD}</div>
        <div class="up-zone-text">
          <strong>${esc(opts.label || "Drag photos here")}</strong>
          <span>${esc(opts.hint || "or click to browse your computer · you can also paste with Ctrl+V")}</span>
        </div>
        <div class="up-zone-actions">
          <button type="button" class="up-mini" data-act="browse" data-no-browse>Browse files</button>
          <button type="button" class="up-mini" data-act="library" data-no-browse>Media library</button>
        </div>
        <input type="file" id="${id}" class="up-input" ${opts.multiple ? "multiple" : ""} accept="${esc(opts.accept || "image/*")}" />
      </div>
      <div class="up-queue"></div>
    `;
  }

  /* -------------------------------------------------------------- single */
  /* One image: hero, artist portrait, artwork main image. */
  function single(mount, opts = {}) {
    const id = "upf" + ++uid;
    let value = opts.value || "";
    const folder = opts.folder || "artworks";

    mount.classList.add("up-single");
    mount.innerHTML = `
      <div class="up-preview" ${value ? "" : 'hidden'}>
        <img alt="" src="${esc(value)}" />
        <div class="up-preview-side">
          <p class="up-preview-label">Current image</p>
          <div class="up-preview-actions">
            <button type="button" class="up-mini" data-act="replace">Replace</button>
            <button type="button" class="up-mini" data-act="library2">Choose existing</button>
            <button type="button" class="up-mini danger" data-act="remove">Remove</button>
          </div>
        </div>
      </div>
      <div class="up-zone-wrap" ${value ? 'hidden' : ""}>
        ${dropZoneHTML(id, { ...opts, multiple: false })}
      </div>
    `;

    const preview = mount.querySelector(".up-preview");
    const wrap = mount.querySelector(".up-zone-wrap");
    const zone = mount.querySelector(".up-zone");
    const input = mount.querySelector("#" + id);
    const queue = mount.querySelector(".up-queue");

    function setValue(url) {
      value = url || "";
      preview.querySelector("img").src = value;
      preview.hidden = !value;
      wrap.hidden = Boolean(value);
      if (opts.onChange) opts.onChange(value);
    }

    const handle = (files) =>
      processFiles(files.slice(0, 1), queue, folder, (res) => setValue(res.url), { imagesOnly: true });

    wireDropZone(zone, input, handle);
    wirePaste(mount, handle);
    zone.querySelector('[data-act="browse"]').onclick = () => input.click();
    zone.querySelector('[data-act="library"]').onclick = () => openLibrary((f) => setValue(f.url));
    preview.querySelector('[data-act="replace"]').onclick = () => input.click();
    preview.querySelector('[data-act="library2"]').onclick = () => openLibrary((f) => setValue(f.url));
    preview.querySelector('[data-act="remove"]').onclick = () => setValue("");

    return {
      get value() { return value; },
      set(url) { setValue(url); },
    };
  }

  /* ------------------------------------------------------------- gallery */
  /* Many images, reorderable, first one is the main image. */
  function gallery(mount, opts = {}) {
    const id = "upg" + ++uid;
    let values = Array.isArray(opts.value) ? opts.value.slice() : [];
    const folder = opts.folder || "artworks";

    mount.classList.add("up-gallery");
    mount.innerHTML = `
      <div class="up-grid"></div>
      ${dropZoneHTML(id, { ...opts, multiple: true })}
    `;

    const grid = mount.querySelector(".up-grid");
    const zone = mount.querySelector(".up-zone");
    const input = mount.querySelector("#" + id);
    const queue = mount.querySelector(".up-queue");

    function commit() {
      if (opts.onChange) opts.onChange(values.slice());
    }

    function render() {
      grid.innerHTML = values
        .map(
          (url, i) => `
        <figure class="up-tile" draggable="true" data-i="${i}">
          <img src="${esc(url)}" alt="" loading="lazy" />
          ${i === 0 ? '<span class="up-tag">Main image</span>' : ""}
          <div class="up-tile-tools">
            ${i > 0 ? '<button type="button" data-act="main" title="Use as main image">★</button>' : ""}
            ${i > 0 ? '<button type="button" data-act="left" title="Move left">←</button>' : ""}
            ${i < values.length - 1 ? '<button type="button" data-act="right" title="Move right">→</button>' : ""}
            <button type="button" data-act="del" title="Remove">✕</button>
          </div>
        </figure>`
        )
        .join("");

      grid.querySelectorAll(".up-tile").forEach((tile) => {
        const i = Number(tile.dataset.i);
        tile.querySelector('[data-act="del"]').onclick = () => {
          values.splice(i, 1);
          render();
          commit();
        };
        tile.querySelector('[data-act="main"]')?.addEventListener("click", () => {
          const [v] = values.splice(i, 1);
          values.unshift(v);
          render();
          commit();
        });
        tile.querySelector('[data-act="left"]')?.addEventListener("click", () => {
          [values[i - 1], values[i]] = [values[i], values[i - 1]];
          render();
          commit();
        });
        tile.querySelector('[data-act="right"]')?.addEventListener("click", () => {
          [values[i + 1], values[i]] = [values[i], values[i + 1]];
          render();
          commit();
        });

        /* Drag one thumbnail onto another to reorder. */
        tile.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", String(i));
          tile.classList.add("is-lifting");
        });
        tile.addEventListener("dragend", () => tile.classList.remove("is-lifting"));
        tile.addEventListener("dragover", (e) => e.preventDefault());
        tile.addEventListener("drop", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const from = Number(e.dataTransfer.getData("text/plain"));
          if (Number.isNaN(from) || from === i) return;
          const [moved] = values.splice(from, 1);
          values.splice(i, 0, moved);
          render();
          commit();
        });
      });
    }

    const handle = (files) =>
      processFiles(files, queue, folder, (res) => {
        values.push(res.url);
        render();
        commit();
      }, { imagesOnly: true });

    wireDropZone(zone, input, handle);
    wirePaste(mount, handle);
    zone.querySelector('[data-act="browse"]').onclick = () => input.click();
    zone.querySelector('[data-act="library"]').onclick = () =>
      openLibrary((f) => {
        values.push(f.url);
        render();
        commit();
      });

    render();
    return {
      get value() { return values.slice(); },
      set(list) { values = (list || []).slice(); render(); },
    };
  }

  /* ---------------------------------------------------------------- file */
  /* A single non-image document — the CV PDF. */
  function file(mount, opts = {}) {
    const id = "upd" + ++uid;
    let value = opts.value || "";

    mount.innerHTML = `
      <div class="up-doc" ${value ? "" : "hidden"}>
        <span class="up-doc-icon">PDF</span>
        <a class="up-doc-link" href="${esc(value)}" target="_blank" rel="noopener">View uploaded CV ↗</a>
        <button type="button" class="up-mini danger" data-act="remove">Remove</button>
      </div>
      ${dropZoneHTML(id, {
        label: opts.label || "Drag your CV PDF here",
        hint: opts.hint || "or click to browse · PDF, DOC or DOCX",
        accept: opts.accept || ".pdf,.doc,.docx,application/pdf",
      })}
    `;

    const doc = mount.querySelector(".up-doc");
    const zone = mount.querySelector(".up-zone");
    const input = mount.querySelector("#" + id);
    const queue = mount.querySelector(".up-queue");

    function setValue(url) {
      value = url || "";
      doc.hidden = !value;
      doc.querySelector(".up-doc-link").href = value;
      if (opts.onChange) opts.onChange(value);
    }

    const handle = (files) =>
      processFiles(files.slice(0, 1), queue, "documents", (res) => setValue(res.url));

    wireDropZone(zone, input, handle);
    zone.querySelector('[data-act="browse"]').onclick = () => input.click();
    zone.querySelector('[data-act="library"]').onclick = () => openLibrary((f) => setValue(f.url));
    doc.querySelector('[data-act="remove"]').onclick = () => setValue("");

    return { get value() { return value; }, set: setValue };
  }

  /* ------------------------------------------------------- media library */
  let libraryModal = null;

  function openLibrary(onPick) {
    if (!libraryModal) {
      libraryModal = el(`
        <div class="lib-modal">
          <div class="lib-card">
            <div class="lib-head">
              <div>
                <p class="eyebrow">Media Library</p>
                <h3>Everything you've uploaded</h3>
              </div>
              <button type="button" class="icon-btn" data-act="close">Close ✕</button>
            </div>
            <div class="lib-grid"></div>
          </div>
        </div>
      `);
      document.body.appendChild(libraryModal);
      libraryModal.addEventListener("click", (e) => {
        if (e.target === libraryModal || e.target.closest('[data-act="close"]')) {
          libraryModal.classList.remove("open");
        }
      });
    }

    const grid = libraryModal.querySelector(".lib-grid");
    grid.innerHTML = `<p class="lib-empty">Loading your files…</p>`;
    libraryModal.classList.add("open");

    Media.library().then((files) => {
      if (!files.length) {
        grid.innerHTML = `<p class="lib-empty">Nothing here yet. Upload your first photo and it'll appear in this library, ready to reuse anywhere on the site.</p>`;
        return;
      }
      grid.innerHTML = files
        .map(
          (f) => `
        <figure class="lib-tile" data-url="${esc(f.url)}" data-path="${esc(f.path)}">
          <img src="${esc(f.url)}" alt="" loading="lazy" />
          <figcaption>${esc(f.name || f.path)}<span>${Media.humanSize(f.size)}</span></figcaption>
          <button type="button" class="lib-del" title="Delete permanently">✕</button>
        </figure>`
        )
        .join("");

      grid.querySelectorAll(".lib-tile").forEach((tile) => {
        tile.addEventListener("click", (e) => {
          if (e.target.closest(".lib-del")) return;
          onPick({ url: tile.dataset.url, path: tile.dataset.path });
          libraryModal.classList.remove("open");
        });
        tile.querySelector(".lib-del").addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!confirm("Delete this file permanently? Any artwork still using it will lose its image.")) return;
          await Media.remove(tile.dataset.path);
          tile.remove();
        });
      });
    });
  }

  return { single, gallery, file, openLibrary };
})();
