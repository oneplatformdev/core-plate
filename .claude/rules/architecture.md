# JS/TS Architecture Rules

## Shared Principles

- Prefer framework-native structure over imported enterprise abstractions.
- Keep domain logic out of UI components.
- Validate inputs at boundaries.
- Use explicit data contracts between server and client.
- Avoid unnecessary service layers in small apps; add them only when they clarify ownership.

## Next.js

- Use App Router conventions.
- Keep server logic in route handlers, server actions, or server-only modules.
- Do not leak secrets into client components.
- Prefer React Server Components by default; move to client components only when interactivity requires it.
- Keep fetch and cache strategy explicit.

## NestJS

- Organize by feature module.
- Use controllers for transport, services for application logic, and providers for cross-cutting infrastructure.
- Use DTOs and validation pipes at boundaries.
- Keep guards, interceptors, and filters explicit and narrowly scoped.

## Vite + React

- Keep page or route composition separate from reusable components.
- Centralize API clients, auth state, and environment access.
- Avoid deeply coupled global stores when local state is sufficient.
- Use React Query or equivalent only when the project already uses it or the data model justifies it.

## API and Contracts

- Version APIs only when there is a real compatibility boundary.
- Use schema validation for external input when practical.
- Keep DTO and response shapes stable and predictable.
- Prefer explicit error handling over silent fallbacks.

## Data Access

- Isolate persistence code behind repository-like modules or services when the backend complexity justifies it.
- Do not scatter raw queries or ORM calls across unrelated layers.
- Keep migrations and schema changes reversible.

## Background Work

- Use queues, cron jobs, or workers only for real asynchronous boundaries.
- Make retries, idempotency, and failure reporting explicit.
