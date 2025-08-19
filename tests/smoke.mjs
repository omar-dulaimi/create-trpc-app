// Minimal smoke tests for the run subcommand against public examples
// Uses prepare-only to avoid starting dev servers in CI.
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function runCli(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['dist/index.js', 'run', ...args], {
      cwd: projectRoot,
      env: { ...process.env, ...env },
      stdio: 'inherit'
    });
    child.on('close', code => code === 0 ? resolve(0) : reject(new Error(`CLI exited ${code}`)));
    child.on('error', reject);
  });
}

// A couple of light-weight examples (path can be adjusted)
const cases = [
  {
    url: 'trpc/trpc-openapi#master',
    examplePath: 'examples/with-nextjs'
  },
  {
    url: 'trpc/examples-next-prisma-starter#main',
    examplePath: '' // repo main example
  }
];

for (const c of cases) {
  const args = [c.url, ...(c.examplePath ? ['--example-path', c.examplePath] : []), '--prepare-only', '--no-install'];
  console.log('Smoke: ', args.join(' '));
  await runCli(args, { ADBLOCK: '1', DISABLE_OPENCOLLECTIVE: '1' });
}

console.log('Smoke tests completed');
