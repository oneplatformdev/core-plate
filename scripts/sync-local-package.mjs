import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const targetProjectArg = process.argv[2] ?? '../../oneplatform-client-admin';
const targetProjectDir = path.resolve(rootDir, targetProjectArg);
const targetPackageDir = path.join(
  targetProjectDir,
  'node_modules',
  '@oneplatformdev',
  'plate'
);

if (!fs.existsSync(distDir)) {
  throw new Error('dist directory does not exist. Run the build first.');
}

if (!fs.existsSync(path.join(distDir, 'index.js'))) {
  throw new Error('dist/index.js does not exist. Build did not complete.');
}

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const syncDir = (sourceDir, destDir) => {
  ensureDir(destDir);

  const sourceEntries = new Map(
    fs.readdirSync(sourceDir, { withFileTypes: true }).map((entry) => [
      entry.name,
      entry,
    ])
  );

  for (const entry of fs.readdirSync(destDir, { withFileTypes: true })) {
    if (sourceEntries.has(entry.name)) continue;

    const fullPath = path.join(destDir, entry.name);
    fs.rmSync(fullPath, { force: true, recursive: true });
  }

  for (const [name, entry] of sourceEntries) {
    const sourcePath = path.join(sourceDir, name);
    const destPath = path.join(destDir, name);

    if (entry.isDirectory()) {
      syncDir(sourcePath, destPath);
      continue;
    }

    ensureDir(path.dirname(destPath));
    fs.copyFileSync(sourcePath, destPath);
  }
};

ensureDir(path.dirname(targetPackageDir));
syncDir(distDir, targetPackageDir);

console.log(`Synced ${distDir} -> ${targetPackageDir}`);
