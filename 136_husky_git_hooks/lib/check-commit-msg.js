#!/usr/bin/env node
/**
 * commit-msg demo: simple Conventional Commits
 * Usage: node lib/check-commit-msg.js .git/COMMIT_EDITMSG
 */
import { readFileSync } from 'node:fs';

const msgFile = process.argv[2];
if (!msgFile) {
  console.error('[husky demo] Thiếu đường dẫn file commit message.');
  process.exit(1);
}

const raw = readFileSync(msgFile, 'utf8');
const firstLine = raw.split(/\r?\n/).find((l) => l.trim() && !l.startsWith('#')) ?? '';

const pattern = /^(feat|fix|docs|chore|refactor|test):\s.+/;
if (!pattern.test(firstLine)) {
  console.error(
    '\n[husky demo] commit-msg FAIL: message phải dạng "type: mô tả"\n' +
      '  type: feat | fix | docs | chore | refactor | test\n' +
      `  nhận được: "${firstLine}"\n`,
  );
  process.exit(1);
}

console.log(`[husky demo] commit-msg OK: ${firstLine}`);
