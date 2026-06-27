import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'coverage', 'manifest.json');

function git(...args) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch {
  console.error('No coverage/manifest.json — run: npm run coverage');
  process.exit(1);
}

const head = git('rev-parse', 'HEAD');
const dirty = Boolean(git('status', '--porcelain'));

if (!head) {
  console.error('Not a git repository — cannot compare commit hash.');
  process.exit(1);
}

if (!manifest.commitHash) {
  console.error('Coverage manifest has no commitHash.');
  process.exit(1);
}

if (manifest.commitHash !== head) {
  console.error(
    `Coverage is stale: manifest=${manifest.commitShort ?? manifest.commitHash}, HEAD=${head.slice(0, 7)}`,
  );
  console.error(`Generated at: ${manifest.generatedAt}`);
  console.error('Run: npm run coverage');
  process.exit(1);
}

if (dirty) {
  console.warn(
    'Warning: working tree has uncommitted changes; coverage may not reflect current files.',
  );
}

console.log(`Coverage is up to date for commit ${manifest.commitShort ?? head.slice(0, 7)}`);
if (manifest.totals) {
  const t = manifest.totals;
  console.log(
    `Totals: ${t.statements.pct}% stmts, ${t.branches.pct}% branches, ${t.functions.pct}% funcs, ${t.lines.pct}% lines`,
  );
}
