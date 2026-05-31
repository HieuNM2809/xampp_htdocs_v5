#!/usr/bin/env node
/**
 * pre-commit demo: fail if any staged file contains FORBIDDEN
 */
import { execSync } from 'node:child_process';

const FORBIDDEN = 'FORBIDDEN';

function getStagedFiles() {
  const out = execSync('git diff --cached --name-only --diff-filter=ACMR', {
    encoding: 'utf8',
  });
  return out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getStagedContent(path) {
  return execSync(`git show :${path}`, { encoding: 'utf8' });
}

const files = getStagedFiles();
if (files.length === 0) {
  console.log('[husky demo] Không có file staged — bỏ qua kiểm tra nội dung.');
  process.exit(0);
}

const bad = [];
for (const file of files) {
  let content;
  try {
    content = getStagedContent(file);
  } catch {
    continue;
  }
  if (content.includes(FORBIDDEN)) {
    bad.push(file);
  }
}

if (bad.length > 0) {
  console.error(
    `\n[husky demo] pre-commit FAIL: file staged chứa "${FORBIDDEN}":\n  - ${bad.join('\n  - ')}\n`,
  );
  process.exit(1);
}

console.log(`[husky demo] pre-commit OK (${files.length} file staged).`);
