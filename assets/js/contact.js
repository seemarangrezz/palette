/* ==========================================================================
   CONTACT — fills in live contact/social details and wires up the
   inquiry form. Works two ways:
   - If SITE_DATA.contact.formEndpoint is set (e.g. a Formspree endpoint),
     the form submits there via fetch and shows an in-page success state.
   - Otherwise it falls back to opening the visitor's email client with a
     pre-filled message, so the form is always functional even before you
     connect a form backend.
   ========================================================================== */

document.addEventListener("site:ready", (e) => {
  const site = e.detail.site;
  const c = site.contact;

  setText("cEmail", c.email); setHref("cEmail", `mailto:${c.email}`);
  setText("cPhone", c.phone); setHref("cPhone", `tel:${(c.phone || "").replace(/\s+/g, "")}`);
  setText("cLocation", c.location);

  const socialMount = document.getElementById("socialRow");
  if (socialMount) {
    const socials = [
      ["Instagram", c.instagram], ["LinkedIn", c.linkedin],
      ["Facebook", c.facebook], ["Pinterest", c.pinterest], ["WhatsApp", c.whatsapp],
    ].filter(([, url]) => url);
    socialMount.innerHTML = socials.map(([label, url]) =>
      `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">${label} ↗</a>`
    ).join("");
  }

  initForm(c);
});

function setText(id, val) { const el = document.getElementById(id); if (el && val) el.textContent = val; }
function setHref(id, val) { const el = document.getElementById(id); if (el) el.href = val; }

function initForm(contact) {
  const form = document.getElementById("inquiryForm");
  const success = document.getElementById("formSuccess");
  if (!form) return;

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const data = new FormData(form);
    const submitBtn = form.querySelector("button[type=submit]");
    const original = submitBtn.textContent;

    if (contact.formEndpoint) {
      submitBtn.textContent = "Sending…";
      submitBtn.disabled = true;
      try {
        const res = await fetch(contact.formEndpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: data,
        });
        if (res.ok) {
          form.reset();
          form.classList.add("hidden");
          success.style.display = "block";
          success.textContent = "Thank you — your inquiry has been sent. I'll be in touch soon.";
        } else {
          throw new Error("Form endpoint error");
        }
      } catch (err) {
        submitBtn.textContent = original;
        submitBtn.disabled = false;
        success.style.display = "block";
        success.style.color = "var(--clay-bright)";
        success.textContent = "Something went wrong sending this automatically — please email directly instead.";
      }
      return;
    }

    // Fallback: open a pre-filled email
    const subject = encodeURIComponent(`Inquiry: ${data.get("reason") || "General"} — from ${data.get("name") || ""}`);
    const body = encodeURIComponent(
      `Name: ${data.get("name")}\nEmail: ${data.get("email")}\nReason: ${data.get("reason")}\n\n${data.get("message")}`
    );
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
  });
}
