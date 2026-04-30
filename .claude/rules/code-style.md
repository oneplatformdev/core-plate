# JS/TS Code Style

## Language Defaults

- Prefer TypeScript unless the repository is intentionally JavaScript-only.
- Use strict compiler settings when TypeScript is present.
- Favor small, typed functions with explicit inputs and outputs.
- Prefer `const` by default; use `let` only when reassignment is required.
- Use strict equality and explicit null handling.

## Module and File Design

- One clear responsibility per file.
- Prefer named exports for shared modules unless the framework convention strongly favors default exports.
- Keep side effects localized and obvious.
- Avoid barrel files when they obscure ownership or cause accidental imports.

## React

- Prefer function components.
- Keep components focused on rendering and interaction.
- Move non-UI business logic into hooks, actions, services, or server modules.
- Do not overuse `useMemo` and `useCallback`; apply them only when profiling or API stability justifies it.

## Node / Nest

- Keep request parsing, validation, business logic, and persistence separated.
- Avoid static global state in server modules.
- Use dependency injection where the host framework already supports it.

## Error Handling

- Fail fast on programmer errors.
- Return typed error shapes or throw framework-native exceptions.
- Do not swallow errors without logging or rethrowing.

## Tooling

- Respect the repository's existing formatter, linter, and import-order configuration.
- Prefer ESLint plus TypeScript checks.
- Use Prettier or Biome only if the project already does.
