// Publish the package using NPM_TOKEN from the environment (typically loaded
// from `.env` via Node 20+ `--env-file`). Writes the token to a temporary
// `.npmrc` that lives only for the duration of the publish, so the token
// never lands in the repo or in shell history.
//
// Usage:
//   yarn release                  # publish to `latest`
//   yarn release --tag next       # publish under the `next` dist-tag first
//   yarn release --dry-run        # validate everything, don't actually upload
//
// Any extra args after the script name are forwarded verbatim to `npm publish`.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const token = process.env.NPM_TOKEN;
if (!token) {
  console.error(
    'NPM_TOKEN is not set. Add it to .env (see .env.example) or export it before running this script.'
  );
  process.exit(1);
}

const REGISTRY = 'https://registry.npmjs.org/';

// Write a self-contained npmrc that pins both the registry AND the auth token.
// Pinning `registry=` avoids picking up the host machine's default (e.g. yarn
// classic sets `registry.yarnpkg.com`, which has no record of this token and
// fails the publish with `ENEEDAUTH`).
const tmpRc = path.join(os.tmpdir(), `op-plate-publish-${process.pid}.npmrc`);
fs.writeFileSync(
  tmpRc,
  `registry=${REGISTRY}\n//registry.npmjs.org/:_authToken=${token}\n`,
  { mode: 0o600 }
);

const cleanup = () => {
  try {
    fs.rmSync(tmpRc, { force: true });
  } catch {
    // best-effort
  }
};

process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(143);
});

const forwardedArgs = process.argv.slice(2);

// CLI flag and env var are belt-and-suspenders alongside the temp .npmrc:
// CLI args have the highest priority in npm config, so they override any
// project-level .npmrc, env-var registry, or yarn-classic shim.
const child = spawn(
  'npm',
  ['publish', `--registry=${REGISTRY}`, ...forwardedArgs],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NPM_CONFIG_USERCONFIG: tmpRc,
      NPM_CONFIG_REGISTRY: REGISTRY,
    },
    // On Windows `npm` is `npm.cmd`; spawn cannot resolve `.cmd` without a shell.
    shell: process.platform === 'win32',
    windowsHide: true,
  }
);

child.on('exit', (code, signal) => {
  cleanup();
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  cleanup();
  console.error('Failed to spawn `npm publish`:', error.message);
  process.exit(1);
});
