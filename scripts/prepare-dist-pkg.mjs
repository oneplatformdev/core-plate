import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

const rootPkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

const distPkg = {
  name: rootPkg.name,
  version: rootPkg.version,
  description: rootPkg.description,
  license: rootPkg.license,
  author: rootPkg.author,
  type: "module",

  main: "./index.cjs",
  module: "./index.js",
  types: "./index.d.ts",

  exports: rootPkg.exports,
  sideEffects: rootPkg.sideEffects,
  peerDependencies: rootPkg.peerDependencies,
  dependencies: rootPkg.dependencies,
  devDependencies: rootPkg.devDependencies
};

fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, "package.json"), JSON.stringify(distPkg, null, 2));
for (const file of ["README.md", "LICENSE"]) {
  if (fs.existsSync(path.join(root, file))) {
    fs.copyFileSync(path.join(root, file), path.join(dist, file));
  }
}
console.log("Prepared dist/package.json");
