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

## Current status / the open decision

**This is a prototype, not yet deployed anywhere.** The single-file hash-routed SPA shape is fine
for rapid iteration/demoing, but is very likely NOT what should actually ship — see the
conversation this file was written from for the reasoning (SEO on hash routes, no per-page
`<title>`/meta/social-preview tags, one big bundle instead of real cacheable pages, real
bookmarkable/shareable URLs). Before real content goes in, expect a decision on:

- Whether to migrate to a static site generator (real per-page HTML output, clean URLs, per-page
  metadata) vs. keep client-side rendering but switch to real paths + prerendering.
- Where this actually gets hosted (affects the build/deploy setup either way).

Until that's decided, treat `site.html` as the reference implementation for design system,
content structure (`RICM_DATA`'s shape), and page-by-page behavior — not as the file that grows
forever. Update this section once that decision is made and the real structure exists.
