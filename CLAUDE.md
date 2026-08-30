# RICM Website Redesign

A redesign of [ricomputermuseum.org](https://www.ricomputermuseum.org) for the Rhode Island
Computer Museum. Currently a single prototype file (`site.html`); not yet built as a real,
deployable multi-page site — see "Current status" below for the open architectural decision.

## What `site.html` actually is

Not a static mockup — it's a real, data-driven client-side single-page app, ~3,960 lines,
everything (CSS + JS + markup) in one file:

- **Hash-based router** (`registerRoute`/`matchRoute`/`navigate`, ~line 1588): `location.hash`
  drives which page renders into `<main id="main">`. ~19 routes registered near the bottom of
  the file (line ~3805), including parameterized detail routes: `/collection/:slug`,
  `/stories/:slug`, `/programs/:slug`, `/events/:slug`, `/exhibits/data-storage/:chapter`.
- **Mock content data**: `window.RICM_DATA` (assigned ~line 1474) holds the arrays each page
  renders from — `D.STORIES`, `D.PROGRAMS`, `D.EVENTS`, collection items, the Data Storage
  exhibit's chapters, etc. This is placeholder/sample content, not the museum's real copy.
- **Page render functions**: `window.RICM` (`R`), populated across several `<script>` blocks —
  one block per page family (Home/Visit/Explore; Collection/Stories; Exhibits/Learn/Programs;
  Create/Events; About/Support/Search) — each exposing `R.pageHome()`, `R.pageVisit()`, etc.,
  which the router calls and injects into `#main`.
- Also handles: mega-menu nav (`NAV` data, ~line 1633), mobile nav panel, a global search
  overlay, a filter drawer, FAQ accordions, a newsletter form — all client-side, no backend.

So structurally this is already organized *by concern* (data / router / nav / per-page-family
render logic) — it's just physically concatenated into one file rather than split into real
separate files, and routed via `#hash` fragments rather than real URLs.

## Design system

Palette/type are drawn from **Section 5 of the RICM Website Design & Experience Specification**
(`RICM_Website_Design_Experience_Specification.docx`, gitignored — kept locally, not in git) —
that spec is the source of truth over any earlier mockup image where the two disagree. Fonts:
**Sora** (display) + **Inter** (body/UI), **IBM Plex Mono** used sparingly for object IDs/specs/
session codes only, never interface text. Fixed light-content / deep-navy-chrome museum identity
— a deliberate single-theme brand commitment (see the big comment at the top of `site.html`),
not an oversight — don't add a dark-mode variant without it being an explicit ask.

## Repo layout

```
site.html              -- the prototype (tracked)
README.md              -- public-facing project description (tracked)
CLAUDE.md              -- this file (tracked)
.gitignore             -- excludes everything below

Base Website/           -- reference screenshots of the CURRENT live site (gitignored)
Prototype Images/        -- AI-generated mockups / design references (gitignored)
RICM_Website_Design_Experience_Specification.docx  -- design spec, source of truth (gitignored)
RICM_Phase5_Content_Migration_Map.xlsx             -- old-site -> new-site content map (gitignored)
*.zip                                              -- misc archived old-page export (gitignored)
```

Gitignored files still exist on disk locally for reference — just not tracked in git. If a
session needs to read one of them for context (the design spec, the migration map), that's fine;
they're just never committed.

## Decision made: migrating to Eleventy, real per-page HTML

Per direct user decision: static site generator, GitHub Pages for now (the museum's own eventual
host is unknown, so nothing here should assume a specific host). **Eleventy** was chosen over
Astro/a hand-rolled build script specifically because it outputs plain static HTML/CSS/JS with no
required client runtime — the most portable choice if the museum ends up hosting somewhere else
later — and its template model (data -> template -> page) is a shallow migration from
`site.html`'s existing data -> render-function -> page shape, not a rewrite.

`site.html` remains the reference implementation for design system, content shape, and
page-by-page behavior for every route not yet migrated — it stays git-tracked (see Repo layout
above) specifically so it keeps serving as that reference during the migration. Remove it from
git once every route below has a real migrated equivalent.

### New site structure (Eleventy)

```
package.json / package-lock.json   -- Eleventy + deps (needs `npm install`)
.eleventy.js                       -- config: passthrough copy, shortcodes, filters, global data
src/
  _data/
    site.json          -- brand name/tagline/address/phone/email/social + canonical base URL
    nav.json            -- top-level nav (label + route) -- SIMPLIFIED, see "Known gaps" below
    icons.js             -- the full ICONS registry, ported verbatim from site.html
    categories.json        -- the 8 collection categories (icon field now holds the REAL icon
                              key directly -- site.html's separate catIcon() lookup function
                              was folded into the data itself, one less indirection)
    stories.json           -- all 15 stories, PARTIAL fields only (title/summary/slug/image/meta
                              -- no body/relatedArtifacts/relatedStories yet, see "Known gaps")
    events.json            -- all 7 events, full fields
  _includes/
    base.njk           -- the whole page shell: head, header/nav, mobile nav, search overlay
                          (UI only, no working index yet), footer, script tag
  assets/
    css/style.css        -- the ENTIRE <style> block from site.html, copied verbatim (plus one
                            real bug fix, see below) -- passthrough-copied as-is, not processed
    js/main.js            -- progressive-enhancement JS only (mobile nav toggle, header
                              compress-on-scroll, newsletter validation, proto-banner dismiss) --
                              NOT a router; pages are real files now, so there's no client-side
                              routing left at all
  index.njk            -- Home page content (front matter: layout/title/description)
```

`.eleventy.js` also ports `RICM_PH` (site.html's inline-SVG placeholder-photo generator) as a
`placeholderImage` shortcode — it now runs once at BUILD time instead of in the browser, so
placeholder art is baked into the static HTML with zero client-side JS dependency at all, a real
improvement over the prototype's own approach, not just a port. Two derived-data globals
(`upcomingEvents`, `featuredStory`) mirror what `pageHome()` used to compute client-side
(`D.EVENTS.filter(...).sort(...)`, `D.STORIES.find(...)`) — computed once at build time instead.

### What's actually migrated so far: Home, Visit, Explore, and About

Every other route from site.html's router table (`/collection`,
`/collection/:slug`, `/stories`, `/stories/:slug`, `/exhibits/data-storage(/:chapter)`, `/learn`,
`/programs`, `/programs/:slug`, `/create`, `/events`, `/events/archive`, `/events/:slug`,
`/support`, `/search`) is **not built yet** — those links in the new nav/footer/Home page point
at real future paths (`/learn/`, etc.) that will 404 until each page gets its own migration pass,
same shape as these four. Follow the same pattern per page: read the matching `pageXxx()`
function in `site.html`, port its markup into a new `.njk` template, add any data it needs to
`_data/` (with full fields this time, not the trimmed set below), wire real nav routes.

**About** (`src/about.njk`) was migrated fourth. New content collections:
**`src/_data/organizations.json`** (8 manufacturer/organization entries, full port) and
**`src/_data/documents.json`** (6 governance/report documents, full port) — both ported from
site.html's `ORGANIZATIONS`/`DOCUMENTS` arrays verbatim. Team members and news items stayed
page-local `{% set %}` arrays in the template itself (same as Visit's hours/FAQs), since nothing
else references them.

Two more real pieces of shared behavior came out of this page, both added to `main.js`:
- **A generic placeholder-link interceptor**: any element with `data-route-link="false"`
  (the annual-report/document download rows here — no real PDFs exist yet — and, retrofitted at
  the same time, the footer's social-media icons, which were pointing at bare `"#"` with no
  interception at all until now) gets its click swallowed and announced through the existing
  `#a11y-announcer` live region instead of silently jumping to the top of the page. Ported from
  site.html's own boot-script click handler + `announce()` helper — sighted users see nothing
  happen (matching the original exactly, verified by direct testing, not assumed), screen reader
  users hear why.
  - **Real design note preserved from the original, not obvious from the code alone**:
    `announce()` is deliberately screen-reader-only — there is no visible toast anywhere in this
    site for a placeholder-link click, by design, both in site.html and in this port.
- **The contact form's real validation logic**, ported from site.html's `wireContactForm` —
  per-field `.has-error` toggling, an email-format regex check, and a success/error message in
  `#contact-form-msg`, paired with a real `announce()` call either way.

**Explore** (`src/explore.njk`) was migrated third — the first page needing a shared content
collection beyond what Home already had:
- **`src/_data/artifacts.json`** — all 18 artifacts from site.html's `ARTIFACTS` array, ported
  with FULL fields this time (specs, significance, relatedObjects/relatedStories/relatedExhibit,
  objectId — not trimmed the way `stories.json` was for Home), since this same data will be
  reused by the Collection list/detail pages later and there was no reason to under-port it twice.
  Each artifact's `images: [img(seed,...), ...]` array became `imageSeeds: [...]` (plain seed
  strings), resolved through the `placeholderImage` shortcode at template time, same pattern as
  every other image field.
- **Two more macros in `macros.njk`**: `artifactStatusBadge(status)` and `artifactCard(a)`,
  ported from site.html's functions of the same names — `artifactCard` calls
  `artifactStatusBadge` internally, confirming macros can call other macros/shortcodes from the
  same imported namespace without issue.
- **A real Nunjucks limitation hit and worked around**: site.html's `pageExplore()` computes
  `D.ARTIFACTS.find(a=>a.id==="apple-iic")` and `D.ARTIFACTS.filter(a=>a.id!=="apple-iic").slice(0,3)`
  inline. Nunjucks has no syntax for an inline filter/find PREDICATE FUNCTION (no arrow functions
  in template expressions), and a `{% set counter = counter + 1 %}` inside a `{% for %}` loop
  does NOT reliably persist across iterations back out to the template (a well-known Jinja2/
  Nunjucks scoping gotcha) — an early draft tried exactly that and would have silently either
  errored or produced wrong results. Fixed the same way Home's `upcomingEvents`/`featuredStory`
  already were: computed as global data in `.eleventy.js` (`featuredArtifact`,
  `otherFeaturedArtifacts`) using real JS array methods, then just referenced directly in the
  template. **General lesson for future migrations**: any `pageXxx()` in site.html that does real
  `.filter()`/`.find()`/`.sort()`/counter-based array logic inline needs its own named global-data
  function in `.eleventy.js` — don't try to reproduce that logic inside the Nunjucks template
  itself.

**Visit** (`src/visit.njk`) was migrated second, as the simplest remaining page (no content
collection dependency — every list on it, hours/prices/quick-facts/accessibility items/FAQs, is
page-local content, not shared data). Two small pieces of new shared infrastructure came out of
it, both reusable by every future page migration:
- **`src/_includes/macros.njk`** — a `breadcrumb(trail, onLight)` Nunjucks macro, ported from
  site.html's own `breadcrumb()` render function. The trail's last item is always plain text
  (`aria-current="page"`), matching the original's behavior exactly. Import with
  `{% import "macros.njk" as m %}`, call with `{{ m.breadcrumb([["Home","/"], ["Visit","/visit/"]]) }}`.
  Add future shared render-helpers (site.html has several: `artifactCard`, `storyCard`,
  `programCard`, `eventCard`, etc.) to this same file as they're needed, not one macro file per
  page.
- **`main.js` gained a generic FAQ-accordion handler** (any `.faq-q`/`.faq-a` pair, wired once at
  page load) — ported from site.html's `wireFaqs(root)`, but global now instead of scoped to a
  per-render `root` element, since there's no per-page render lifecycle left to hook into (pages
  are real static files). Works for any future page that reuses the same `.faq-item` markup.

### Known gaps / deliberate simplifications, flagged so they're not mistaken for the final shape

- **`nav.json` is top-level links only** — the mega-menu columns and feature-story/feature-
  program callouts from site.html's `NAV` array were dropped for this pass. The dropdown mega-menu
  interaction itself was NOT ported at all yet (real click-through to a page is what the nav does
  now, not a hover panel) — a real follow-up, not an oversight left silently.
- **`stories.json` only carries title/summary/slug/topics/era/storyType/imageSeed/readTime** — no
  `body`, `people`, `organizations`, `relatedArtifacts`, `relatedStories` yet. Fine for Home (only
  needs the one featured-story teaser) but the Stories list/detail pages will need the full
  fields added back in when they're migrated.
- **Global search is UI-only** — the overlay opens/closes (`main.js`) but there's no search index
  wired up yet (site.html's own `runGlobalSearch`/`renderSearchOverlayBody` weren't ported this
  pass either).
- **`PROGRAMS`/`ARTIFACTS`/`ORGANIZATIONS`/`PEOPLE`/`DOCUMENTS`/`CREATE_RESOURCES`/`REDIRECT_MAP`/
  `DATA_STORAGE_CHAPTERS`** from site.html's data layer haven't been ported to `_data/` at all yet
  — none of them are needed by Home; port each one when its matching page is migrated.
- **No GitHub Actions deploy workflow yet** — building/serving locally works (`npm run build` /
  `npm run serve`), but nothing auto-deploys to GitHub Pages yet. Needs a workflow file plus a
  decision on `pathPrefix` (a GitHub Pages *project* page like
  `username.github.io/RICM` needs `.eleventy.js` to set `pathPrefix: "/RICM/"`; a custom domain or
  a user/org page needs `pathPrefix: "/"`, the current default) — deferred since the final host
  is still unknown.

### A real, pre-existing bug found and fixed during verification

Live-browser testing (not just reading the build output) caught a genuine contrast bug in
site.html's OWN design system, not something the migration introduced: `.btn-outline` defaults to
navy text/border on a transparent background, and `.bg-navy .btn-outline` overrides that to white
— but the Hero section uses `.hero` (also a dark navy background), which had no matching override.
"Explore the Museum" (and any future hero-section outline button) rendered navy-on-navy, nearly
invisible — confirmed via computed styles (`color: rgb(14,26,40)` against a `rgb(14,26,40)`-ish
background) before touching anything. Fixed with one small addition to `style.css`:
`.hero .btn-outline` now gets the same white-on-transparent treatment `.bg-navy .btn-outline`
already had. This is the one deliberate deviation from "CSS ported verbatim" — flagged here
specifically so it's not mistaken for a copy error later.

### Verified

Real `npm install` + `npx @11ty/eleventy` build succeeds with zero errors, producing exactly
`_site/index.html` + passthrough-copied `_site/assets/css/style.css` + `_site/assets/js/main.js`.
Output HTML inspected directly: correct `<title>`/meta description/canonical URL, nav rendering
real routes, every Home section (hero, info strip incl. real next-upcoming-event data sorted
correctly, 6 start-here cards, featured story, 3 upcoming events sorted by date, 7 categories +
"More Categories", Learn/Create bands, donate CTA, newsletter form) present with real substituted
data and zero `undefined`/`[object Object]`/`NaN` leaks. Re-verified live in an actual browser via
Eleventy's own dev server (`--serve`): screenshot confirmed the hero renders correctly with real
fonts (Sora) and real inline-SVG placeholder art; `get_page_text` confirmed the full page's real
text content matches expectations end-to-end; direct computed-style/DOM checks confirmed the
`.hero .btn-outline` fix took effect, `.cat-grid`/`.footer-top` grids resolve to the right column
counts, and the stylesheet actually loaded.

**Real tool limitation hit, not a site bug**: the browser pane's `screenshot` action reliably
returns a blank white image any time it's called shortly after a `scroll` action in this session
(reproduced twice, unrelated to scroll amount) — confirmed NOT a rendering bug by checking the DOM
at that exact scroll position (`document.elementFromPoint` found real, correctly-classed content
there) and by using `get_page_text` instead, which returned the full, correct page text. Screenshot
worked fine at the initial (unscrolled) top-of-page position both times. Worth trying
`get_page_text`/direct DOM inspection first if a scrolled screenshot ever looks suspiciously blank
again in this project, rather than assuming content failed to render.

**Also required as a real environment prerequisite**: Node.js was not installed on this machine at
all; installed via `winget install --id OpenJS.NodeJS.LTS` this session (LTS, v24) specifically so
the build could be verified rather than shipped unverified. Whoever picks up the next page
migration needs Node available the same way (or already will, if it's the same machine).

**Visit page verified the same rigorous way**: real build (zero errors), output HTML inspected
directly (correct title/canonical, breadcrumb macro rendering correctly with a nested `icon`
shortcode call, all hours/price/quick-facts/accessibility/FAQ content present with zero
`undefined`/`[object Object]` leaks), then loaded live via the dev server — screenshot confirmed
the breadcrumb, active "Visit" nav underline, and hero CTAs render correctly (including the
`.hero .btn-outline` fix applying here too, for free, since it's a shared style rule); `get_page_text`
confirmed every section's real text; and the FAQ accordion's actual click behavior was exercised
via a real `.click()` call, confirming `aria-expanded` flips and the answer's `hidden` attribute
clears with the correct answer text revealed — a genuine interaction test, not just a static-HTML
check.

**Explore page verified the same way**: real build (zero errors), output HTML inspected directly
(correct title/canonical, breadcrumb, all 4 start-here tiles, the Fraser Archives band, and
exactly 4 artifact cards — the featured Apple IIc plus the next 3 non-Apple-IIc artifacts in
array order, matching `D.ARTIFACTS.filter(...).slice(0,3)`'s real behavior — each with correct
name/year/manufacturer/summary/status badge), then loaded live via the dev server: screenshot
confirmed the active "Explore" nav underline, breadcrumb, and hero CTAs (including the shared
`.hero .btn-outline` contrast fix applying automatically); `get_page_text` confirmed every
section's real text end-to-end, including all 4 artifact cards' correct status badges
(On Display / Archived).

**About page verified with real interaction tests, not just static-HTML inspection**: real build
(zero errors), output HTML inspected directly (correct title/canonical, exactly 4 team cards, 4
partner tiles, 6 document rows, all with correct real data). Live in the browser: screenshot
confirmed active nav/breadcrumb; then the contact form was actually exercised end-to-end —
submitting empty correctly showed the error message and added `.has-error` to the name field,
filling in valid data and resubmitting correctly showed the success message, cleared
`.has-error`, and reset the form; a real click on a placeholder `.doc-row` link was confirmed to
NOT change `location.href` (no navigation); and the screen-reader-only `#a11y-announcer` region
was confirmed to actually receive the expected announcement text after that click — the full
accessibility pipeline verified working, not just assumed from reading the code.
