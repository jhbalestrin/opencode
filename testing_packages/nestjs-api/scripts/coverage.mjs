import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const coverageDir = join(root, 'coverage');

function git(...args) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

const commitHash = git('rev-parse', 'HEAD');
const commitShort = git('rev-parse', '--short', 'HEAD');
const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
const porcelain = git('status', '--porcelain');
const workingTreeDirty = Boolean(porcelain);

const jest = spawnSync(
  'npx',
  ['jest', '--coverage', '--silent'],
  {
    cwd: root,
    env: {
      ...process.env,
      NODE_OPTIONS: process.env.NODE_OPTIONS ?? '--max-old-space-size=1024',
    },
    stdio: 'inherit',
  },
);

const jestExitCode = jest.status ?? 1;

let totals = null;
try {
  const summary = JSON.parse(
    readFileSync(join(coverageDir, 'coverage-summary.json'), 'utf8'),
  );
  totals = summary.total ?? null;
} catch {
  // coverage-summary.json missing if jest config changes
}

const threshold = 80;
const thresholdMet =
  totals !== null &&
  totals.statements.pct >= threshold &&
  totals.branches.pct >= threshold &&
  totals.functions.pct >= threshold &&
  totals.lines.pct >= threshold;

const manifest = {
  commitHash,
  commitShort,
  branch,
  workingTreeDirty,
  generatedAt: new Date().toISOString(),
  coverageDirectory: 'coverage',
  thresholdPercent: threshold,
  thresholdMet,
  totals,
  stale:
    commitHash === null
      ? 'unknown (not a git repository)'
      : workingTreeDirty
        ? 'working tree has uncommitted changes since this report'
        : null,
};

writeFileSync(
  join(coverageDir, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

if (commitHash) {
  writeFileSync(join(coverageDir, 'COMMIT'), `${commitHash}\n`);
}

console.log('');
console.log(
  `Coverage written to coverage/ (commit ${commitShort ?? 'unknown'})`,
);
console.log('Compare with current HEAD: git rev-parse HEAD');
console.log('Quick check: cat coverage/COMMIT');

process.exit(jestExitCode);
