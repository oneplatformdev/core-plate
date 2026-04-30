import fs from 'node:fs';
import path, { extname, relative } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const srcDir = fileURLToPath(new URL('./src', import.meta.url));
const packageJson = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')
) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const external = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
];

const isExternal = (id: string) =>
  external.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));

const sourceExtensions = ['.ts', '.tsx'];

const toPosixPath = (value: string) => value.replaceAll('\\', '/');

const resolveSourceImport = (importer: string, specifier: string) => {
  let importPath: string;

  if (specifier.startsWith('@/')) {
    importPath = path.join(srcDir, specifier.slice(2));
  } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
    importPath = path.resolve(path.dirname(importer), specifier);
  } else {
    return null;
  }

  const candidates = [
    importPath,
    ...sourceExtensions.map((extension) => `${importPath}${extension}`),
    ...sourceExtensions.map((extension) =>
      path.join(importPath, `index${extension}`)
    ),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
};

const collectReachableSourceFiles = () => {
  const entry = fileURLToPath(new URL('./src/index.ts', import.meta.url));
  const entries = new Set<string>();
  const stack = [entry];
  const importPattern =
    /(?:import|export)(?:[\s\S]*?)from\s*['"]([^'"]+)['"]/g;

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || entries.has(current)) {
      continue;
    }

    entries.add(current);

    const source = fs.readFileSync(current, 'utf8');
    let match: RegExpExecArray | null;

    while ((match = importPattern.exec(source))) {
      const resolved = resolveSourceImport(current, match[1]);

      if (resolved) {
        stack.push(resolved);
      }
    }
  }

  return [...entries];
};

const createBuildEntries = (filenames: string[]) =>
  Object.fromEntries(
    filenames.map((filename) => [
      toPosixPath(
        relative(srcDir, filename.slice(0, filename.length - extname(filename).length))
      ),
      filename,
    ])
  );

export default defineConfig(({ command }) => {
  const reachableSourceFiles =
    command === 'build' ? collectReachableSourceFiles() : null;

  return {
    plugins: [
      react(),
      tailwindcss(),
      dts({
        entryRoot: 'src',
        tsconfigPath: path.join(rootDir, 'tsconfig.app.json'),
        bundledPackages: [],
        include: reachableSourceFiles
          ? reachableSourceFiles.map((filename) =>
              toPosixPath(relative(rootDir, filename))
            )
          : ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: ['src/app/**/*', 'sandbox/**/*'],
      }),
    ],
  server: {
    fs: {
      allow: [rootDir],
    },
  },
  optimizeDeps: {
    include: ['is-hotkey'],
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'platejs'],
    alias: [
      {
        find: '@oneplatformdev/plate/styles.css',
        replacement: path.join(srcDir, 'index.css'),
      },
      {
        find: '@oneplatformdev/plate',
        replacement: path.join(srcDir, 'index.ts'),
      },
      { find: '@/', replacement: `${srcDir}/` },
      { find: '@', replacement: srcDir },
    ],
  },
    build:
      command === 'build' && reachableSourceFiles
        ? {
            outDir: './dist',
            emptyOutDir: true,
            reportCompressedSize: true,
            commonjsOptions: {
              transformMixedEsModules: true,
            },
            lib: {
              cssFileName: 'styles',
              entry: createBuildEntries(reachableSourceFiles),
              formats: ['es'],
            },
            rollupOptions: {
              external: isExternal,
              output: {
                preserveModules: true,
                preserveModulesRoot: 'src',
                exports: 'named',
              },
            },
            minify: 'esbuild',
            sourcemap: false,
            target: 'es2018',
          }
        : undefined,
  };
});
