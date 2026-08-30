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

  /* ---- Learn page's Program Finder form, ported from pageLearn()'s inline
     submit handler. Builds the same comma-joined-per-category query string
     (age=9-12,13-17&interest=robotics) the future /programs/ page will read,
     rather than relying on native multi-checkbox GET semantics (which would
     produce repeated ?age=a&age=b params instead). ---- */
  var learnFinderForm = qs("#learn-finder-form");
  if (learnFinderForm) {
    learnFinderForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(learnFinderForm);
      var params = new URLSearchParams();
      ["age", "interest", "location"].forEach(function (key) {
        var values = fd.getAll(key);
        if (values.length) params.set(key, values.join(","));
      });
      var qs2 = params.toString();
      window.location.href = "/programs/" + (qs2 ? "?" + qs2 : "");
    });
  }

  /* ---- saved programs (localStorage-backed, ported from site.html's
     saved()/toggleSaved()/wireSaveButtons). Every [data-save-program] button
     is server-rendered as "not saved" (there's no per-visitor knowledge at
     build time) -- this corrects each one's aria-pressed/label/icon fill for
     this specific visitor's browser as soon as the page loads, then wires
     the click-to-toggle behavior. ---- */
  var SAVED_PROGRAMS_KEY = "ricm_saved_programs";
  function getSavedPrograms() {
    try { return JSON.parse(localStorage.getItem(SAVED_PROGRAMS_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function toggleSavedProgram(id) {
    try {
      var s = getSavedPrograms();
      if (s.indexOf(id) !== -1) { s = s.filter(function (x) { return x !== id; }); }
      else { s.push(id); }
      localStorage.setItem(SAVED_PROGRAMS_KEY, JSON.stringify(s));
      return s.indexOf(id) !== -1;
    } catch (e) { return false; }
  }
  function setSaveButtonState(btn, isSaved) {
    btn.setAttribute("aria-pressed", String(isSaved));
    btn.setAttribute("aria-label", isSaved ? "Remove from saved programs" : "Save program");
  }
  var initiallySaved = getSavedPrograms();
  document.querySelectorAll("[data-save-program]").forEach(function (btn) {
    if (initiallySaved.indexOf(btn.dataset.saveProgram) !== -1) setSaveButtonState(btn, true);
    btn.addEventListener("click", function () {
      var isSaved = toggleSavedProgram(btn.dataset.saveProgram);
      setSaveButtonState(btn, isSaved);
      announce(isSaved ? "Program saved." : "Program removed from saved list.");
    });
  });

  /* ---- Stories page: basic client-side filtering (search + era/type/topic
     checkboxes), per direct user direction -- a real but deliberately
     simpler alternative to site.html's full URL-synced faceted search
     (debounced search, filter drawer, pagination, chip removal). All 15
     stories render server-side; this just shows/hides cards already on the
     page and never rewrites the URL as filters change. It DOES read the
     URL once on load, so a deep link like /stories/?type=Person (used by
     this page's own "Browse By" tiles, and by Explore's nav) still lands
     pre-filtered correctly. ---- */
  var storiesGrid = qs("#stories-card-grid");
  if (storiesGrid) {
    var storyCards = Array.prototype.slice.call(storiesGrid.querySelectorAll(".story-card"));
    var storiesEmptyState = qs("#stories-empty-state");
    var storiesCount = qs("#stories-results-count");
    var storiesSearch = qs("#stories-search");

    function getCheckedFilterValues(name) {
      return Array.prototype.slice
        .call(document.querySelectorAll('[data-filter="' + name + '"]:checked'))
        .map(function (el) { return el.value; });
    }
    // Multiple checkboxes can share the same [data-filter]+value (the "Popular
    // Topics" quick pills duplicate some of the sidebar's topic checkboxes) --
    // keep every instance of a given value in sync when one of them changes.
    function syncFilterCheckboxes(name, value, checked) {
      document.querySelectorAll('[data-filter="' + name + '"][value="' + value + '"]').forEach(function (el) {
        el.checked = checked;
      });
    }

    function applyStoriesFilters() {
      var eras = getCheckedFilterValues("era");
      var types = getCheckedFilterValues("type");
      var topics = getCheckedFilterValues("topic");
      var kw = (storiesSearch ? storiesSearch.value : "").trim().toLowerCase();
      var visibleCount = 0;
      storyCards.forEach(function (card) {
        var cardTopics = card.dataset.topics ? card.dataset.topics.split(",") : [];
        var matches = true;
        if (eras.length && eras.indexOf(card.dataset.era) === -1) matches = false;
        if (matches && types.length && types.indexOf(card.dataset.type) === -1) matches = false;
        if (matches && topics.length && !topics.some(function (t) { return cardTopics.indexOf(t) !== -1; })) matches = false;
        if (matches && kw && card.dataset.search.indexOf(kw) === -1) matches = false;
        card.style.display = matches ? "" : "none";
        if (matches) visibleCount++;
      });
      if (storiesCount) storiesCount.innerHTML = visibleCount + " <span>stor" + (visibleCount === 1 ? "y" : "ies") + " found</span>";
      storiesGrid.hidden = visibleCount === 0;
      if (storiesEmptyState) storiesEmptyState.hidden = visibleCount !== 0;
    }

    document.querySelectorAll("[data-filter]").forEach(function (input) {
      input.addEventListener("change", function () {
        syncFilterCheckboxes(input.dataset.filter, input.value, input.checked);
        applyStoriesFilters();
      });
    });
    if (storiesSearch) storiesSearch.addEventListener("input", applyStoriesFilters);
    var storiesReset = qs("#stories-reset");
    if (storiesReset) {
      storiesReset.addEventListener("click", function () {
        document.querySelectorAll("[data-filter]").forEach(function (el) { el.checked = false; });
        if (storiesSearch) storiesSearch.value = "";
        applyStoriesFilters();
      });
    }

    // Pre-filter from the URL once on load (?type=Person, ?era=1980s,
    // ?topic=Robotics -- comma-joined for multiple values, matching the
    // convention Learn's Program Finder already writes).
    var initialParams = new URLSearchParams(window.location.search);
    ["era", "type", "topic"].forEach(function (name) {
      var raw = initialParams.get(name);
      if (!raw) return;
      raw.split(",").forEach(function (value) { syncFilterCheckboxes(name, value, true); });
    });
    applyStoriesFilters();
  }

  /* ---- support CTAs (Support page), ported from site.html's wireSupportModal.
     #support-modal-root exists as a reserved-but-unused mount point in
     site.html too -- no real modal is wired up there yet, ported as-is. ---- */
  document.querySelectorAll("[data-support-cta]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var heading = btn.closest(".support-tile, section");
      var h3 = heading ? heading.querySelector("h3") : null;
      announce("Thanks for your interest in " + (h3 ? h3.textContent : "supporting RICM") + ". A contact form would open here in the full site.");
      var label = btn.textContent.trim();
      btn.insertAdjacentHTML(
        "afterend",
        '<p style="margin-top:.75em;font-size:var(--fs-xs);color:var(--status-good);display:flex;gap:.4em;align-items:center;">Thanks — this prototype demonstrates the "' + label + '" action; the live site will open a request form here.</p>'
      );
      btn.disabled = true;
    }, { once: true });
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
