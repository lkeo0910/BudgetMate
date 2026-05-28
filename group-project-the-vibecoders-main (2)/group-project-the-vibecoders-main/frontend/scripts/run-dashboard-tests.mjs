import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const mode = process.argv[2] ?? 'all';
const cwd = process.cwd();
const outDir = join(cwd, '.dashboard-tests-dist');

if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true, force: true });
}

execFileSync('node_modules/.bin/tsc', ['-p', 'tsconfig.dashboard-tests.json'], {
  cwd,
  stdio: 'inherit',
});

const targets =
  mode === 'integration'
    ? ['tests/dashboard.integration.test.js']
    : mode === 'unit'
      ? ['tests/dashboard.logic.test.js']
      : ['tests/dashboard.logic.test.js', 'tests/dashboard.integration.test.js'];

execFileSync('node', ['--test', ...targets], {
  cwd: outDir,
  stdio: 'inherit',
});
