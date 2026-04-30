# Releasing `@oneplatformdev/plate`

End-to-end guide for cutting a new version. Two parallel tracks live side by side:

- **Prerelease iteration** — `yarn release` ships micro-fixes under the `next` dist-tag without disturbing existing consumers.
- **Stable promotion** — `yarn release:patch | minor | major` promotes a soaked prerelease (or a hand-crafted change) to the `latest` dist-tag, which is what every `npm install @oneplatformdev/plate` resolves to.

Read this once, then most days you'll only need the [TL;DR](#tldr) at the bottom.

---

## One-time setup

Before your first release on a given machine:

1. **Install Node 20+ and corepack-enabled yarn 4.**
   ```bash
   node --version    # ≥ 20
   corepack enable   # picks up packageManager: yarn@4.0.2 from package.json
   yarn --version    # 4.x
   ```
   On Windows where yarn classic is globally installed, `corepack enable` is the step that swaps to yarn 4 for this project. Without it, scripts may run on yarn 1.x — the publish still works but you lose yarn 4 features.

2. **Generate an npm access token.**
   - Open `https://www.npmjs.com/settings/<your-user>/tokens`
   - Create a new token with **Automation** type (bypasses 2FA OTP — required for non-interactive scripts)
   - Scope: read & write on `@oneplatformdev`

3. **Save the token to `.env`** (gitignored — never commit it).
   ```bash
   cp .env.example .env
   # Edit .env, paste the token after NPM_TOKEN=
   ```

That's it. From here every release is a one-line command.

---

## Daily flow: prerelease iteration

The most common case. You have a fix, edit, or experimental change. You want to share it with the team or a specific consumer without promoting it to the default `latest` channel.

```bash
yarn release
```

What that one command does in order:

1. **`npm version prerelease --preid=next`** — bumps to the next prerelease number, makes a git commit, creates an annotated tag.
   - First time from `0.1.0` → `0.1.1-next.0`
   - Subsequent calls → `0.1.1-next.1`, `0.1.1-next.2`, …
2. **`yarn build:ts`** — full type-check + Vite build + dist preparation.
3. **`npm publish --tag next`** — publishes the tarball to `https://registry.npmjs.org/` under the `next` dist-tag (uses the token from `.env`).
4. **`git push --follow-tags`** — sends the version commit and the new tag to `origin`.

### Who sees the prerelease

| Consumer command | Resolves to |
|---|---|
| `npm install @oneplatformdev/plate` (no specifier) | `latest` (still `0.1.0`, unchanged) |
| `npm install @oneplatformdev/plate@^0.1.0` | `latest` matching `^0.1.0` (still `0.1.0`) |
| `npm install @oneplatformdev/plate@next` | the latest prerelease (`0.1.1-next.X`) |
| `npm install @oneplatformdev/plate@0.1.1-next.3` | exactly that version |

Caret ranges (`^0.1.0`) **do not** include prereleases per semver spec — that's the entire point of the two-track separation. Existing consumers stay calm; only those who explicitly opt in via `@next` get the new bits.

### Iterate as long as you need

```bash
yarn release       # 0.1.1-next.0
yarn release       # 0.1.1-next.1
yarn release       # 0.1.1-next.2
…
yarn release       # 0.1.1-next.42
```

Every call linearly increments the trailing number. No version is ever lost; every prerelease stays on npm forever (it's append-only).

---

## Promotion: prerelease → stable

When a `0.1.1-next.X` has soaked enough and you trust it, promote it to `latest`:

### 1. Update `CHANGELOG.md`

`npm version` does **not** touch the changelog. Before promoting, write the new version's section by hand:

```markdown
## [0.1.1] — 2026-MM-DD

### Fixed
- Concrete bug fix description

### Changed
- API tweak that keeps backwards compatibility
```

Commit it:

```bash
git add CHANGELOG.md
git commit -m "docs: changelog 0.1.1"
```

### 2. Run the promotion command

```bash
yarn release:patch
```

What that one command does:

1. **`npm version patch`** — from a prerelease (e.g. `0.1.1-next.42`) this **strips the suffix** and lands on `0.1.1` (not `0.1.2`! `npm version patch` has special prerelease handling). Commits, tags `v0.1.1`.
2. **`yarn build:ts`** — full build.
3. **`npm publish`** — publishes to `latest` dist-tag (no `--tag next`).
4. **`git push --follow-tags`** — propagates commit + tag to remote.

After the command:

| dist-tag | Points to |
|---|---|
| `latest` | `0.1.1` ← **NEW**, what every consumer auto-receives |
| `next` | `0.1.1-next.42` (the last prerelease — harmless leftover, will be overwritten when next prerelease cycle starts) |

### 3. (Optional) Create the GitHub release

For visibility on github.com:

```bash
gh release create v0.1.1 --notes-file CHANGELOG.md --latest
```

This is purely cosmetic — npm publish + git tag are what matter for consumers. But the GitHub release page shows up nicely in the repo's "Releases" section and feeds RSS/email subscribers.

Skip this step for prereleases (would just be noise on the timeline).

---

## When to use `:minor` or `:major` instead

| You want… | Use | Behavior on prerelease |
|---|---|---|
| Promote current next-target patch to stable | `release:patch` | `0.1.1-next.42` → `0.1.1` |
| Skip current patch, jump to next minor (you added new public API during prerelease) | `release:minor` | `0.1.1-next.42` → `0.2.0` (abandons the `0.1.1` cycle) |
| Breaking change shipping with this release | `release:major` | `0.1.1-next.42` → `1.0.0` |

Pick by what changed in your prerelease cycle, not by version arithmetic.

---

## After promotion: continuing on the same project

The new prerelease cycle starts automatically on the next `yarn release`:

```bash
yarn release       # from 0.1.1 → 0.1.2-next.0 (under `next`, doesn't touch latest)
yarn release       # → 0.1.2-next.1
…
yarn release:patch # → 0.1.2 on latest
```

Or if you have a definitive feature ready without iteration:

```bash
yarn release:minor   # from 0.1.1 → 0.2.0 directly on latest
```

---

## Recovery scenarios

### "Build failed half-way through `yarn release`"

`npm version` already created the commit + tag, but build broke before publish. Recover by retrying the publish without re-bumping:

```bash
yarn release:current --tag next   # for a prerelease retry
yarn release:current              # for a stable retry
git push --follow-tags            # if not yet pushed
```

`release:current` is the lower-level "build + publish only" — same as `yarn release` minus the version bump.

### "Publish failed (network / auth / 409)"

Same as above — version is bumped, just retry the publish piece.

### "I want to undo a local bump (not yet pushed)"

```bash
git reset --hard HEAD~1     # undo the version commit
git tag -d v0.1.1-next.0    # delete the local tag
```

Then start over.

### "I already pushed but want to remove the prerelease from npm"

You generally **cannot** unpublish from npm after 72 hours. Within 72 hours, `npm unpublish @oneplatformdev/plate@0.1.1-next.3` works but is heavily discouraged. Better path:

```bash
yarn release   # publish a new prerelease that supersedes the bad one
```

Bumping forward is almost always safer than deleting backward.

### "I want to remove the `next` dist-tag entirely"

After a promotion, the `next` tag still points at the last prerelease. Optional cleanup:

```bash
NPM_TOKEN=... npm dist-tag rm @oneplatformdev/plate next \
  --userconfig=<(echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN")
```

Or just leave it — the next `yarn release` overwrites it anyway. Most projects leave `next` permanently in place.

---

## Command reference

### High-level (covers 95% of cases)

| Command | Bumps to | Dist-tag | Pushes |
|---|---|---|---|
| `yarn release` | `0.1.0` → `0.1.1-next.0` → `0.1.1-next.1` → … | `next` | yes |
| `yarn release:patch` | strips `-next.X` → `0.1.1`, or stable→stable `0.1.1` → `0.1.2` | `latest` | yes |
| `yarn release:minor` | → `0.2.0` | `latest` | yes |
| `yarn release:major` | → `1.0.0` | `latest` | yes |

### Lower-level (recovery / manual flows)

| Command | Bumps version | Builds | Publishes | Pushes |
|---|---|---|---|---|
| `yarn release:current` | no | yes | yes (latest) | no |
| `yarn release:current --tag next` | no | yes | yes (next) | no |
| `yarn release:current --dry-run` | no | yes | no (validates only) | no |
| `yarn version:prerelease` | yes (`-next.X`) | no | no | no |
| `yarn version:patch` | yes (strip prerelease or +1 patch) | no | no | no |
| `yarn version:minor` | yes (+1 minor, reset patch) | no | no | no |
| `yarn version:major` | yes (+1 major, reset minor+patch) | no | no | no |

---

## Mechanics under the hood

For when you need to debug or modify the flow.

- **`scripts/release.mjs`** wraps `npm publish`. Reads `NPM_TOKEN` from the environment (loaded by Node 20's `--env-file=.env` flag), writes a temporary `.npmrc` (mode 600) in `os.tmpdir()` with the registry pinned to `https://registry.npmjs.org/`, sets `NPM_CONFIG_USERCONFIG` to that file, and forwards extra args (`--dry-run`, `--tag next`, etc.) to `npm publish`. The temp file is deleted on exit, including SIGINT/SIGTERM.

- **Cross-platform**: the spawn uses `shell: process.platform === 'win32'` so Windows resolves `npm.cmd` (Node's `child_process.spawn` doesn't follow PATHEXT without a shell). Belt-and-suspenders for the registry pin: CLI flag `--registry=`, env var `NPM_CONFIG_REGISTRY`, `publishConfig.registry` in `package.json`, and the `registry=` line in the temp `.npmrc`. Any one of these is enough; together they survive any combination of host npm/yarn config.

- **Stale-build safety**: every `release*` script chains `yarn build:ts` before `npm publish`. Direct `npm publish` does **not** auto-build — always go through `yarn release` / `yarn release:patch|minor|major` / `yarn release:current`. There is no `prepublishOnly` hook on purpose: explicit chains are easier to follow than implicit lifecycle magic.

- **Token never lands on disk persistently**: `.env` is gitignored, the temp `.npmrc` lives only for the duration of `npm publish`. Rotate the token immediately if it leaks (e.g. pasted into chat).

---

## TL;DR

```bash
yarn release          # 0.1.0 → 0.1.1-next.0  (next, повторюй для -next.1, -next.2, …)
yarn release:patch    # 0.1.1-next.7 → 0.1.1  (latest)
yarn release:minor    # 0.1.1-next.7 → 0.2.0  (latest)
yarn release:major    # 0.1.1-next.7 → 1.0.0  (latest)
```
