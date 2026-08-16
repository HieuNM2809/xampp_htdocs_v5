// Mirror every downloadable asset referenced by the socialmmovn.com homepage
// (images, CSS, JS, plus url() targets inside the CSS) into public/, then emit a
// "localized" HTML + CSS whose asset URLs point at those local copies.
//
// Unlike the HSCO page (base64-inlined), this WordPress/Flatsome page references
// assets by URL, so the job is: collect URLs -> download -> rewrite references.
//
// Run:  node scripts/mirror-assets-socialmmovn-root.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const RESEARCH = 'docs/research/socialmmovn-com/root';
const PUBLIC_ROOT = 'public/sites/socialmmovn';
const ASSET_DIR = join(PUBLIC_ROOT, 'assets');
const PUBLIC_PREFIX = '/sites/socialmmovn/assets'; // served at web root by Next.js

// Only these hosts get mirrored + rewritten. Third-party analytics/captcha stay remote.
const MIRROR_HOSTS = new Set([
  'socialmmovn.com',
  'www.socialmmovn.com',
  'cdn.jsdelivr.net',
  'vn1.vdrive.vn',
  'sp-ao.shortpixel.ai',
  'hanoidep.vn',
  'cellphones.com.vn',
  'antimatter.vn',
]);

const html = readFileSync(join(RESEARCH, 'index.raw.html'), 'utf8');
const css = readFileSync(join(RESEARCH, 'style.css'), 'utf8');

// url -> { localPath (fs), webPath (served) } ; also records failures
const map = new Map();
const failures = [];

function toAbsolute(u, base = 'https://socialmmovn.com/') {
  if (!u) return null;
  u = u.trim().replace(/&amp;/g, '&');
  if (u.startsWith('data:') || u.startsWith('#') || u.startsWith('mailto:') || u.startsWith('javascript:')) return null;
  if (u.startsWith('//')) return 'https:' + u;
  try {
    return new URL(u, base).href;
  } catch {
    return null;
  }
}

function plan(u, base) {
  const abs = toAbsolute(u, base);
  if (!abs) return null;
  let parsed;
  try { parsed = new URL(abs); } catch { return null; }
  if (!/^https?:$/.test(parsed.protocol)) return null;
  if (!MIRROR_HOSTS.has(parsed.hostname)) return null;
  if (map.has(abs)) return map.get(abs);

  // Local path mirrors host + pathname; querystrings folded into the filename.
  let rel = parsed.hostname + decodeURIComponent(parsed.pathname);
  if (rel.endsWith('/')) rel += 'index';
  if (parsed.search) {
    const q = parsed.search.replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
    rel += q;
  }
  rel = rel.replace(/[^a-zA-Z0-9._/-]/g, '_');
  const entry = { abs, localPath: join(ASSET_DIR, rel), webPath: `${PUBLIC_PREFIX}/${rel}` };
  map.set(abs, entry);
  return entry;
}

// ---- 1. Collect URLs from HTML attributes -------------------------------------
const ATTR_RE = /(?:src|href|data-src|data-lazy-src|content|poster)\s*=\s*"([^"]+)"/gi;
for (const m of html.matchAll(ATTR_RE)) plan(m[1]);

// srcset: comma-separated "url 700w, url 1200w"
for (const m of html.matchAll(/srcset\s*=\s*"([^"]+)"/gi)) {
  for (const part of m[1].split(',')) plan(part.trim().split(/\s+/)[0]);
}
// inline style="background-image:url(...)"
for (const m of html.matchAll(/url\((['"]?)([^)'"]+)\1\)/gi)) plan(m[2]);

// ---- 2. Collect url() targets from the main CSS (fonts, bg images) -------------
const cssBase = 'https://socialmmovn.com/wp-content/litespeed/css/';
for (const m of css.matchAll(/url\((['"]?)([^)'"]+)\1\)/gi)) plan(m[2], cssBase);

// ---- 3. Download everything (bounded concurrency) ------------------------------
const entries = [...map.values()];
console.log(`assets to mirror: ${entries.length}`);

async function download(entry) {
  if (existsSync(entry.localPath)) return true;
  try {
    const res = await fetch(entry.abs, {
      headers: { 'user-agent': 'Mozilla/5.0 (clone-mirror; +local)', 'referer': 'https://socialmmovn.com/' },
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    mkdirSync(dirname(entry.localPath), { recursive: true });
    writeFileSync(entry.localPath, buf);
    return true;
  } catch (e) {
    failures.push({ url: entry.abs, error: String(e.message || e) });
    return false;
  }
}

const CONCURRENCY = 6;
let idx = 0;
let ok = 0;
async function worker() {
  while (idx < entries.length) {
    const e = entries[idx++];
    const done = await download(e);
    if (done) ok++;
    if ((ok + failures.length) % 20 === 0) console.log(`  …${ok + failures.length}/${entries.length}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`downloaded: ${ok}, failed: ${failures.length}`);

// ---- 4. Rewrite HTML + CSS to local paths --------------------------------------
function rewrite(text, base) {
  // Replace longest URLs first so a prefix never clobbers a longer match.
  const successes = [...map.values()].filter((e) => existsSync(e.localPath));
  successes.sort((a, b) => b.abs.length - a.abs.length);
  for (const e of successes) {
    // absolute
    text = text.split(e.abs).join(e.webPath);
    // protocol-relative form
    text = text.split(e.abs.replace(/^https?:/, '')).join(e.webPath);
  }
  return text;
}

writeFileSync(join(RESEARCH, 'index.local.html'), rewrite(html));
// CSS: rewrite absolute forms; relative url() inside CSS resolved against cssBase already mapped.
let localCss = css;
for (const e of [...map.values()].filter((x) => existsSync(x.localPath)).sort((a, b) => b.abs.length - a.abs.length)) {
  localCss = localCss.split(e.abs).join(e.webPath);
}
writeFileSync(join(ASSET_DIR, 'style.local.css'), localCss);

writeFileSync(
  join(RESEARCH, 'MIRROR_MANIFEST.json'),
  JSON.stringify(
    {
      totalReferenced: entries.length,
      downloaded: ok,
      failed: failures.length,
      failures,
      publicPrefix: PUBLIC_PREFIX,
    },
    null,
    2,
  ),
);

console.log('localized HTML : ' + join(RESEARCH, 'index.local.html'));
console.log('localized CSS  : ' + join(ASSET_DIR, 'style.local.css'));
console.log('manifest       : ' + join(RESEARCH, 'MIRROR_MANIFEST.json'));
