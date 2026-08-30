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
})();
