const ICONS = require("./src/_data/icons.js");
const EVENTS = require("./src/_data/events.json");
const STORIES = require("./src/_data/stories.json");
const ARTIFACTS = require("./src/_data/artifacts.json");

/* ==========================================================================
   Placeholder photography generator — ported verbatim from site.html's
   RICM_PH() (see CLAUDE.md). Originally ran in the browser at render time;
   here it runs once at BUILD time as an Eleventy shortcode, so placeholder
   images are baked into the static HTML with no client-side JS dependency
   at all — a real improvement over the prototype, not just a port.
   ========================================================================== */
function hashStr(s) {
  let h = 0;
  s = String(s);
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const PALETTES = [
  ["#0E1A28", "#1168E5"], ["#0E1A28", "#00C2B2"], ["#16283b", "#7C3AED"],
  ["#0E1A28", "#FF8A00"], ["#142B45", "#00C2B2"], ["#1e3550", "#1168E5"],
  ["#0E1A28", "#7C3AED"], ["#16283b", "#00C2B2"],
];

const GLYPHS = {
  monitor: (s) => `<rect x="${-s*.5}" y="${-s*.4}" width="${s}" height="${s*.68}" rx="${s*.05}"/><line x1="0" y1="${s*.28}" x2="0" y2="${s*.46}"/><line x1="${-s*.32}" y1="${s*.46}" x2="${s*.32}" y2="${s*.46}"/>`,
  disc: (s) => `<circle r="${s*.5}"/><circle r="${s*.13}"/>`,
  chip: (s) => `<rect x="${-s*.32}" y="${-s*.32}" width="${s*.64}" height="${s*.64}" rx="${s*.06}"/><line x1="${-s*.12}" y1="${-s*.32}" x2="${-s*.12}" y2="${-s*.48}"/><line x1="${s*.12}" y1="${-s*.32}" x2="${s*.12}" y2="${-s*.48}"/><line x1="${-s*.12}" y1="${s*.32}" x2="${-s*.12}" y2="${s*.48}"/><line x1="${s*.12}" y1="${s*.32}" x2="${s*.12}" y2="${s*.48}"/><line x1="${-s*.32}" y1="${-s*.12}" x2="${-s*.48}" y2="${-s*.12}"/><line x1="${-s*.32}" y1="${s*.12}" x2="${-s*.48}" y2="${s*.12}"/><line x1="${s*.32}" y1="${-s*.12}" x2="${s*.48}" y2="${-s*.12}"/><line x1="${s*.32}" y1="${s*.12}" x2="${s*.48}" y2="${s*.12}"/>`,
  book: (s) => `<path d="M${-s*.42} ${-s*.36} h${s*.38} a${s*.06} ${s*.06} 0 0 1 ${s*.06} ${s*.06} v${s*.6} h-${s*.44}z"/><path d="M${s*.42} ${-s*.36} h-${s*.38} a${s*.06} ${s*.06} 0 0 0 -${s*.06} ${s*.06} v${s*.6} h${s*.44}z"/>`,
  people: (s) => `<circle cx="${-s*.16}" cy="${-s*.12}" r="${s*.16}"/><circle cx="${s*.2}" cy="${-s*.06}" r="${s*.11}"/><path d="M${-s*.42} ${s*.42} q0 -${s*.3} ${s*.26} -${s*.3} q${s*.26} 0 ${s*.26} ${s*.3}"/>`,
  gear: (s) => `<circle r="${s*.22}"/><circle r="${s*.05}" fill="currentColor" stroke="none"/>${Array.from({length:8}).map((_,i)=>{const a=i*Math.PI/4;return `<line x1="${Math.cos(a)*s*.22}" y1="${Math.sin(a)*s*.22}" x2="${Math.cos(a)*s*.36}" y2="${Math.sin(a)*s*.36}"/>`;}).join("")}`,
};
const GLYPH_KEYS = Object.keys(GLYPHS);

function placeholderImage(seed, w, h) {
  w = w || 800;
  h = h || 600;
  const hashed = hashStr(seed);
  const [c1, c2] = PALETTES[hashed % PALETTES.length];
  const angle = hashed % 90;
  const glyphKey = GLYPH_KEYS[hashed % GLYPH_KEYS.length];
  const s = Math.min(w, h) * 0.26;
  const uid = "g" + (hashed % 100000);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="">
<defs>
<linearGradient id="${uid}" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(${angle} .5 .5)">
<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
</linearGradient>
<pattern id="${uid}d" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})">
<circle cx="2" cy="2" r="1.5" fill="#ffffff" opacity="0.10"/>
</pattern>
</defs>
<rect width="${w}" height="${h}" fill="url(#${uid})"/>
<rect width="${w}" height="${h}" fill="url(#${uid}d)"/>
<g transform="translate(${w/2},${h/2})" fill="none" stroke="#ffffff" stroke-width="${Math.max(2,s*0.045)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.42">${GLYPHS[glyphKey](s)}</g>
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg).replace(/'/g, "%27").replace(/"/g, "%22");
}

function monthAbbr(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
}
function dayNum(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.getDate();
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addGlobalData("currentYear", () => new Date().getFullYear());

  // Derived views over the raw content collections — mirrors what
  // site.html's pageHome() computed client-side (D.EVENTS.filter(...).sort(...),
  // D.STORIES.find(...)), just computed once at build time instead.
  eleventyConfig.addGlobalData("upcomingEvents", () =>
    EVENTS.filter((e) => e.status === "upcoming").sort((a, b) => a.date.localeCompare(b.date))
  );
  eleventyConfig.addGlobalData("featuredStory", () =>
    STORIES.find((s) => s.id === "rise-of-home-computing")
  );
  // Mirrors pageExplore()'s `D.ARTIFACTS.find(...)` / `D.ARTIFACTS.filter(...).slice(0,3)` —
  // computed here rather than in the template because Nunjucks has no way to author an
  // inline filter/find predicate function, and a for-loop-scoped counter doesn't reliably
  // persist across iterations the way plain JS array methods do.
  eleventyConfig.addGlobalData("featuredArtifact", () =>
    ARTIFACTS.find((a) => a.id === "apple-iic")
  );
  eleventyConfig.addGlobalData("otherFeaturedArtifacts", () =>
    ARTIFACTS.filter((a) => a.id !== "apple-iic").slice(0, 3)
  );

  eleventyConfig.addShortcode("placeholderImage", placeholderImage);
  eleventyConfig.addShortcode("icon", function (name, cls) {
    return (ICONS[name] || "").replace("<svg ", cls ? `<svg class="${cls}" ` : "<svg ");
  });
  eleventyConfig.addFilter("monthAbbr", monthAbbr);
  eleventyConfig.addFilter("dayNum", dayNum);

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
};
