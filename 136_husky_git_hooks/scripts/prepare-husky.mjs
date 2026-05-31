#!/usr/bin/env node
/**
 * Chỉ chạy `husky` khi thư mục project là git root.
 * Tránh ghi đè hooks của repo cha (xampp_htdocs_v5) khi npm install trong 136/.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.env.HUSKY === '0' || process.env.CI === 'true') {
  process.exit(0);
}

let gitRoot;
try {
  gitRoot = execSync('git rev-parse --show-toplevel', {
    cwd: projectRoot,
    encoding: 'utf8',
  }).trim();
} catch {
  process.exit(0);
}

const norm = (p) => path.normalize(path.resolve(p));
if (norm(gitRoot) !== norm(projectRoot)) {
  console.log(
    '[136 husky] Bỏ qua cài hook: thư mục này không phải git root.',
  );
  console.log('  Chạy: npm run setup:sandbox  → thử trong sandbox/');
  process.exit(0);
}

execSync('husky', { cwd: projectRoot, stdio: 'inherit' });
