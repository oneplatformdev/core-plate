import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const rootPkgPath = path.join(rootDir, 'package.json');
const distPkgPath = path.join(distDir, 'package.json');

if (!fs.existsSync(distDir)) {
  throw new Error('dist directory does not exist. Run the build first.');
}

// `vite-plugin-dts` (configured with `entryRoot: 'src'`) emits declaration
// files under `dist/src/`. Flatten them into `dist/` so the published layout
// matches the JS output (e.g. `dist/index.d.ts` next to `dist/index.js`), then
// rewrite any `../foo` references that came from the lifted nesting level.
const tscEmitDir = path.join(distDir, 'src');
if (fs.existsSync(tscEmitDir)) {
  const moveDeclarationFiles = (fromDir, toDir) => {
    for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
      const fromPath = path.join(fromDir, entry.name);
      const toPath = path.join(toDir, entry.name);

      if (entry.isDirectory()) {
        fs.mkdirSync(toPath, { recursive: true });
        moveDeclarationFiles(fromPath, toPath);
        continue;
      }

      if (entry.name.endsWith('.d.ts') || entry.name.endsWith('.d.mts')) {
        fs.mkdirSync(path.dirname(toPath), { recursive: true });
        fs.copyFileSync(fromPath, toPath);
      }
    }
  };

  moveDeclarationFiles(tscEmitDir, distDir);

  const fixUpwardReferences = (dirPath) => {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (fullPath === tscEmitDir) continue;
        fixUpwardReferences(fullPath);
        continue;
      }

      if (!entry.name.endsWith('.d.ts') && !entry.name.endsWith('.d.mts')) {
        continue;
      }

      const source = fs.readFileSync(fullPath, 'utf8');
      const rewritten = source.replace(
        /(from\s+['"]|import\s*\(\s*['"])(\.\.\/[^'"]+)(['"])/g,
        (_, prefix, specifier, suffix) => {
          let normalized = path.posix.normalize(specifier.replace(/^\.\.\//, './'));
          if (!normalized.startsWith('.')) normalized = `./${normalized}`;
          return `${prefix}${normalized}${suffix}`;
        }
      );

      if (rewritten !== source) {
        fs.writeFileSync(fullPath, rewritten);
      }
    }
  };

  fixUpwardReferences(distDir);

  try {
    fs.rmSync(tscEmitDir, { recursive: true, force: true });
  } catch {
    // Windows AV may briefly lock the dir; cleanup failure is non-fatal.
  }
}

const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));

const distPkg = {
  name: rootPkg.name,
  version: rootPkg.version,
  description: rootPkg.description,
  license: rootPkg.license ?? 'MIT',
  repository: rootPkg.repository,
  homepage: rootPkg.homepage,
  bugs: rootPkg.bugs,
  keywords: rootPkg.keywords,
  author: rootPkg.author,
  type: 'module',
  main: './index.js',
  module: './index.js',
  types: './index.d.ts',
  exports: {
    '.': {
      types: './index.d.ts',
      import: './index.js',
      default: './index.js',
    },
    './styles.css': './styles.css',
    './styles.scoped.css': './styles.scoped.css',
    './package.json': './package.json',
  },
  sideEffects: ['**/*.css'],
  peerDependencies: rootPkg.peerDependencies ?? {},
  peerDependenciesMeta: rootPkg.peerDependenciesMeta,
  dependencies: rootPkg.dependencies ?? {},
  publishConfig: rootPkg.publishConfig,
};

for (const key of Object.keys(distPkg)) {
  if (distPkg[key] === undefined) delete distPkg[key];
}

fs.writeFileSync(distPkgPath, JSON.stringify(distPkg, null, 2));

const readmePath = path.join(rootDir, 'README.md');
if (fs.existsSync(readmePath)) {
  fs.copyFileSync(readmePath, path.join(distDir, 'README.md'));
}

const licensePath = path.join(rootDir, 'LICENSE');
if (fs.existsSync(licensePath)) {
  fs.copyFileSync(licensePath, path.join(distDir, 'LICENSE'));
}

const rewriteAliasImports = (dirPath) => {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      rewriteAliasImports(fullPath);
      continue;
    }

    if (!entry.name.endsWith('.d.ts')) {
      continue;
    }

    const fileDir = path.dirname(fullPath);
    const source = fs.readFileSync(fullPath, 'utf8');
    const rewritten = source.replace(/@\/([^'"]+)/g, (_, subpath) => {
      const targetPath = path.join(distDir, subpath);
      let relativePath = path.relative(fileDir, targetPath).replaceAll('\\', '/');

      if (!relativePath.startsWith('.')) {
        relativePath = `./${relativePath}`;
      }

      return relativePath;
    });

    if (rewritten !== source) {
      fs.writeFileSync(fullPath, rewritten);
    }
  }
};

rewriteAliasImports(distDir);

// Emit a scoped variant of styles.css for consumers that need to isolate
// editor styles from their host app (e.g. when global Tailwind CSS variables
// would collide). Selectors are prefixed with `.op-plate-scope`; consumers
// wrap the editor in `<div className="op-plate-scope">` and import
// `@oneplatformdev/plate/styles.scoped.css` instead of `./styles.css`.
const stylePath = path.join(distDir, 'styles.css');
const scopedStylePath = path.join(distDir, 'styles.scoped.css');
const scopeClass = '.op-plate-scope';

if (fs.existsSync(stylePath)) {
  const css = fs.readFileSync(stylePath, 'utf8');
  const root = postcss.parse(css);

  root.walkRules((rule) => {
    const parent = rule.parent;
    if (parent && parent.type === 'atrule' && /keyframes$/i.test(parent.name)) {
      return;
    }

    rule.selectors = rule.selectors.map((selector) => {
      const current = selector.trim();
      if (!current) return selector;
      if (current.startsWith(':root')) {
        return `${scopeClass}${current.slice(':root'.length)}`;
      }
      return `${scopeClass} ${current}`;
    });
  });

  fs.writeFileSync(scopedStylePath, root.toString());
}
