// Extract every inlined base64 image from the downloaded HSCO homepage into real
// files under public/, and emit a "localized" HTML whose data: URIs are rewritten
// to those file paths. Identical images (same bytes) are de-duplicated by content
// hash so the 65 inline occurrences collapse to however many unique assets exist.
//
// Run:  node scripts/extract-assets-hsco-root.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const RESEARCH = 'docs/research/hsco-furniture-com/root';
const OUT_DIR = 'public/sites/hsco/images';
const SRC_HTML = join(RESEARCH, 'index.raw.html');

mkdirSync(OUT_DIR, { recursive: true });

const html = readFileSync(SRC_HTML, 'utf8');

const MIME_EXT = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

// Matches both  src="data:..."  and  url('data:...')  forms. Group 1 = mime, 2 = payload.
const RE = /data:(image\/[a-z.+-]+);base64,([A-Za-z0-9+/=]+)/g;

const byHash = new Map(); // hash -> { file, ext, count }
let order = 0;
const manifest = [];

const localized = html.replace(RE, (_m, mime, b64) => {
  order += 1;
  const ext = MIME_EXT[mime] || 'bin';
  const buf = Buffer.from(b64, 'base64');
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 10);

  let entry = byHash.get(hash);
  if (!entry) {
    const file = `img-${hash}.${ext}`;
    writeFileSync(join(OUT_DIR, file), buf);
    entry = { file, ext, bytes: buf.length, occurrences: 0 };
    byHash.set(hash, entry);
  }
  entry.occurrences += 1;
  const publicPath = `/sites/hsco/images/${entry.file}`;
  manifest.push({ order, mime, hash, bytes: buf.length, publicPath });
  return publicPath;
});

writeFileSync(join(RESEARCH, 'index.local.html'), localized);
writeFileSync(
  join(RESEARCH, 'ASSET_MANIFEST.json'),
  JSON.stringify(
    {
      totalInlineOccurrences: order,
      uniqueImages: byHash.size,
      outputDir: OUT_DIR,
      images: [...byHash.values()].sort((a, b) => b.bytes - a.bytes),
    },
    null,
    2,
  ),
);

console.log(`inline occurrences : ${order}`);
console.log(`unique images      : ${byHash.size}`);
console.log(`written to         : ${OUT_DIR}`);
console.log(`localized HTML     : ${join(RESEARCH, 'index.local.html')}`);
