#!/usr/bin/env node
/**
 * Tạo sandbox/ — repo Git mini để học Husky an toàn.
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = path.join(root, 'sandbox');

const COPY = ['package.json', '.husky', 'lib', 'scripts', '.gitignore'];

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

if (existsSync(sandbox)) {
  rmSync(sandbox, { recursive: true, force: true });
}
mkdirSync(sandbox, { recursive: true });

for (const name of COPY) {
  const src = path.join(root, name);
  if (!existsSync(src)) continue;
  cpSync(src, path.join(sandbox, name), { recursive: true });
}

writeFileSync(
  path.join(sandbox, 'README.md'),
  `# Sandbox Husky (136)

Repo demo riêng. Thử:

\`\`\`powershell
echo "ok" > demo.txt
git add demo.txt
git commit -m "feat: commit hợp lệ"
\`\`\`
`,
);

run('git init', sandbox);
run('git branch -M main', sandbox);
run('npm install', sandbox);

console.log('\n✓ Sandbox sẵn sàng: cd sandbox && git commit ...\n');
