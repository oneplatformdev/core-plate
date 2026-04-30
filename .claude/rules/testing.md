# Testing Rules

## Tool Selection

- `Vitest` for Vite apps, libraries, and fast unit/component tests
- `Jest` for NestJS or repos already standardized on Jest
- `Playwright` for browser E2E and critical UI journeys

## Coverage Strategy

- Test business logic directly.
- Test HTTP contracts and API boundaries.
- Test React components for behavior, not implementation details.
- Use E2E sparingly for high-value end-to-end flows.

## What to Test

- validation and error handling
- authorization and access control
- state transitions
- data-fetching edge cases
- retry, timeout, and fallback behavior
- serialization and response shapes

## What Not to Over-Test

- framework internals
- trivial getters or pass-through wrappers
- static presentational markup without logic
- generated code with no custom behavior

## Standards

- Keep tests deterministic.
- Prefer factories, builders, or fixtures over large inline setup.
- Mock external systems narrowly.
- Each regression fix should add a focused regression test when practical.

## Validation Commands

Use the repo-native scripts when they exist, typically one or more of:

```bash
pnpm test
pnpm test:unit
pnpm test:e2e
pnpm lint
tsc -b
pnpm build
```
