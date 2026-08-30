/* ==========================================================================
   RICM — progressive-enhancement JS
   Ported from site.html's shell-wiring script (see CLAUDE.md), trimmed down
   to what a real multi-page site still needs client-side: pages are now
   real HTML files, so there's no router here at all — just the small bits
   of interactivity static HTML can't do on its own (mobile nav toggle,
   sticky-header compress-on-scroll, newsletter validation, the prototype
   banner's dismiss-and-remember).
   ========================================================================== */
(function () {
  "use strict";

  function qs(sel, root) { return (root || document).querySelector(sel); }

  /* ---- screen-reader-only announcements (ported from site.html's announce()) ---- */
  function announce(msg, assertive) {
    var el = document.getElementById(assertive ? "a11y-announcer-assertive" : "a11y-announcer");
    if (!el) return;
    el.textContent = "";
    window.setTimeout(function () { el.textContent = msg; }, 60);
  }

  /* ---- placeholder links (data-route-link="false") ---- */
  document.addEventListener("click", function (e) {
    var link = e.target.closest('[data-route-link="false"]');
    if (link) {
      e.preventDefault();
      announce("This link is a placeholder in the prototype and does not navigate.");
    }
  });

  /* ---- sticky header compress ---- */
  var header = qs("#site-header");
  var lastScrollState = false;
  function onWindowScroll() {
    var compact = window.scrollY > 40;
    if (compact !== lastScrollState) {
      header.classList.toggle("is-compact", compact);
      lastScrollState = compact;
    }
  }
  if (header) window.addEventListener("scroll", onWindowScroll, { passive: true });

  /* ---- mobile nav ---- */
  var mobileNavPanel = qs("#mobile-nav-panel");
  var mobileMenuBtn = qs("#mobile-menu-btn");
  var mobileMenuClose = qs("#mobile-menu-close");
  function openMobileNav() {
    mobileNavPanel.hidden = false;
    requestAnimationFrame(function () { mobileNavPanel.classList.add("is-open"); });
    mobileMenuBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeMobileNav() {
    mobileNavPanel.classList.remove("is-open");
    mobileMenuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    setTimeout(function () { mobileNavPanel.hidden = true; }, 220);
  }
  if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openMobileNav);
  if (mobileMenuClose) mobileMenuClose.addEventListener("click", closeMobileNav);

  /* ---- search overlay (UI only — no working search index yet, see CLAUDE.md) ---- */
  var searchOverlay = qs("#search-overlay");
  var searchOpenBtn = qs("#search-open-btn");
  var searchCloseBtn = qs("#search-close-btn");
  function openSearchOverlay() {
    searchOverlay.hidden = false;
    requestAnimationFrame(function () { searchOverlay.classList.add("is-open"); });
    var input = qs("#global-search-input");
    if (input) input.focus();
  }
  function closeSearchOverlay() {
    searchOverlay.classList.remove("is-open");
    setTimeout(function () { searchOverlay.hidden = true; }, 220);
  }
  if (searchOpenBtn) searchOpenBtn.addEventListener("click", openSearchOverlay);
  if (searchCloseBtn) searchCloseBtn.addEventListener("click", closeSearchOverlay);
  if (searchOverlay) {
    searchOverlay.addEventListener("click", function (e) {
      if (e.target.id === "search-overlay") closeSearchOverlay();
    });
  }

  /* ---- newsletter form ---- */
  var form = qs("#newsletter-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = qs("#newsletter-email");
      var msg = qs("#newsletter-msg");
      var val = input.value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!valid) {
        msg.innerHTML = '<span class="newsletter-msg err">Enter a valid email address, like name@example.com.</span>';
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      msg.innerHTML = '<span class="newsletter-msg ok">Thanks — you\'re on the list for RICM news and updates.</span>';
      form.reset();
    });
  }

  /* ---- prototype banner dismiss (remembered per-browser) ---- */
  var PROTO_BANNER_KEY = "ricm_proto_banner_dismissed";
  var banner = qs("#proto-banner");
  var bannerClose = qs("#proto-banner-close");
  if (banner) {
    var dismissed = false;
    try { dismissed = localStorage.getItem(PROTO_BANNER_KEY) === "1"; } catch (e) {}
    if (!dismissed) banner.hidden = false;
    if (bannerClose) {
      bannerClose.addEventListener("click", function () {
        banner.hidden = true;
        try { localStorage.setItem(PROTO_BANNER_KEY, "1"); } catch (e) {}
      });
    }
  }

  /* ---- FAQ accordions (any .faq-q / .faq-a pair, ported from site.html's
     wireFaqs — global now instead of per-page-render, since pages are real
     static files and there's no render lifecycle left to hook into) ---- */
  document.querySelectorAll(".faq-q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      var target = document.getElementById(btn.getAttribute("aria-controls"));
      if (target) target.hidden = open;
    });
  });

  /* ---- contact form (About page), ported from site.html's wireContactForm ---- */
  var contactForm = qs("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = qs("#contact-name", contactForm);
      var email = qs("#contact-email", contactForm);
      var msg = qs("#contact-msg", contactForm);
      var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      var ok = true;
      [
        [name, name.value.trim().length > 0],
        [email, emailValid],
        [msg, msg.value.trim().length > 0]
      ].forEach(function (pair) {
        var field = pair[0], valid = pair[1];
        field.closest(".field").classList.toggle("has-error", !valid);
        if (!valid) ok = false;
      });
      var out = qs("#contact-form-msg");
      if (!ok) {
        out.innerHTML = '<span class="newsletter-msg err" style="color:var(--status-bad);">Please fill in every field with a valid email address.</span>';
        announce("There is a problem with the contact form. Please review the highlighted fields.", true);
        return;
      }
      out.innerHTML = '<span class="newsletter-msg ok" style="color:var(--status-good);">Thanks — RICM will be in touch soon.</span>';
      announce("Your message has been sent.");
      contactForm.reset();
    });
  }
})();
