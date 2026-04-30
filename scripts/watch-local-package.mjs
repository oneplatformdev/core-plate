import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const rootDir = process.cwd();
const targetProjectArg = process.argv[2];

if (!targetProjectArg) {
  throw new Error(
    'Target project path is required. Usage: node scripts/watch-local-package.mjs <path-to-consumer>'
  );
}

const watchRoots = [
  path.join(rootDir, 'src'),
  path.join(rootDir, 'scripts'),
  path.join(rootDir, 'package.json'),
  path.join(rootDir, 'tsconfig.app.json'),
  path.join(rootDir, 'tsconfig.build.json'),
  path.join(rootDir, 'vite.config.ts'),
];

let building = false;
let pending = false;
let timer = null;

const run = async (file, args, label) => {
  await new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      cwd: rootDir,
      shell: process.platform === 'win32',
      stdio: 'inherit',
      windowsHide: true,
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`[watch] ${label} done`);
        resolve();
        return;
      }

      reject(new Error(`${label} exited with code ${code ?? 'unknown'}`));
    });
  });
};

const buildAndSync = async () => {
  if (building) {
    pending = true;
    return;
  }

  building = true;
  pending = false;

  console.log('[watch] build started');

  try {
    await run('tsc', ['-p', 'tsconfig.build.json'], 'tsc');
    await run('vite', ['build'], 'vite build');
    await run(process.execPath, ['scripts/prepare-dist-pkg.mjs'], 'prepare dist');
    await run(
      process.execPath,
      ['scripts/sync-local-package.mjs', targetProjectArg],
      'sync package'
    );
    console.log('[watch] build finished');
  } catch (error) {
    console.error('[watch] build failed');
    console.error(error instanceof Error ? error.message : error);
  } finally {
    building = false;

    if (pending) {
      pending = false;
      void buildAndSync();
    }
  }
};

const scheduleBuild = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void buildAndSync();
  }, 250);
};

for (const watchRoot of watchRoots) {
  if (!fs.existsSync(watchRoot)) continue;

  const stat = fs.statSync(watchRoot);

  if (stat.isDirectory()) {
    fs.watch(
      watchRoot,
      { recursive: true },
      () => {
        scheduleBuild();
      }
    );
    continue;
  }

  fs.watch(watchRoot, () => {
    scheduleBuild();
  });
}

console.log(`[watch] watching ${rootDir}`);
console.log(`[watch] target project: ${path.resolve(rootDir, targetProjectArg)}`);

await buildAndSync();
